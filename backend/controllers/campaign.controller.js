const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const User = require('../models/User');
const { expireOverdueCampaigns } = require('../utils/expireCampaigns');
const notify = require('../services/email');

// ─────────────────────────────────────────
// GET ALL CAMPAIGNS (for influencer browse)
// ─────────────────────────────────────────
exports.getCampaigns = async (req, res) => {
  try {
    const {
      niche,
      city,
      platform,
      page = 1,
      limit = 12
    } = req.query;

    // Flip any overdue campaigns to 'expired' so they drop out of the browse list.
    await expireOverdueCampaigns();

    // Fetch this influencer's niches for automatic campaign filtering
    const influencerProfile = await InfluencerProfile.findOne({ userId: req.userId }).select('niche');
    const influencerNiches = influencerProfile?.niche ?? [];

    // Exclude campaigns where this influencer was explicitly rejected
    const rejectedApplications = await Application.find({
      influencerId: req.userId,
      status: 'rejected'
    }).select('campaignId');
    const rejectedCampaignIds = rejectedApplications.map(a => a.campaignId);

    // Build filter query
    const query = { status: 'active', _id: { $nin: rejectedCampaignIds } };

    // Only show campaigns whose niches overlap with the influencer's niches.
    // Campaigns with no niches set are shown to everyone.
    if (influencerNiches.length > 0) {
      query.$or = [
        { niche: { $size: 0 } },
        { niche: { $in: influencerNiches } },
      ];
    }

    // Manual niche filter from the UI narrows further within the influencer's niches
    if (niche) {
      const requestedNiches = niche.split(',');
      // Intersect with influencer's niches so they can't bypass the profile filter
      const allowed = influencerNiches.length > 0
        ? requestedNiches.filter(n => influencerNiches.includes(n))
        : requestedNiches;
      if (allowed.length > 0) {
        // Replace the $or with a stricter niche match
        delete query.$or;
        query.niche = { $in: allowed };
      } else if (influencerNiches.length > 0) {
        // Requested niches have no overlap with the influencer's profile niches — no results
        query._id = { $in: [] };
        delete query.$or;
      }
    }

    if (city && city !== 'all') {
      const cityConditions = [{ targetCity: city }, { targetCity: 'all' }];
      // Merge with existing $or if present
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: cityConditions }];
        delete query.$or;
      } else {
        query.$or = cityConditions;
      }
    }

    if (platform && platform !== 'any') {
      // Match campaigns that target this platform, plus campaigns with no
      // platform restriction (empty targetPlatforms = "any platform").
      const platformCond = { $or: [{ targetPlatforms: { $size: 0 } }, { targetPlatforms: platform }] };
      if (query.$and) {
        query.$and.push(platformCond);
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, platformCond];
        delete query.$or;
      } else {
        query.$or = platformCond.$or;
      }
    }

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('brandId', 'name'),
      Campaign.countDocuments(query)
    ]);

    // Batch-fetch brand profiles for logo and website
    const brandIds = [...new Set(campaigns.map(c => c.brandId?._id?.toString()).filter(Boolean))];
    const brandProfiles = await BrandProfile.find(
      { userId: { $in: brandIds } },
      { userId: 1, logoUrl: 1, website: 1, companyName: 1, industry: 1, description: 1, gstinVerified: 1 }
    );
    const brandProfileMap = {};
    brandProfiles.forEach(bp => { brandProfileMap[bp.userId.toString()] = bp; });

    const enriched = campaigns.map(c => {
      const obj = c.toObject();
      const bp = brandProfileMap[obj.brandId?._id?.toString()];
      return {
        ...obj,
        brandLogoUrl: bp?.logoUrl || '',
        brandWebsite: bp?.website || '',
        brandCompanyName: bp?.companyName || '',
        brandIndustry: bp?.industry || '',
        brandDescription: bp?.description || '',
        brandGstinVerified: bp?.gstinVerified || false,
      };
    });

    res.json({
      campaigns: enriched,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET SINGLE CAMPAIGN
// ─────────────────────────────────────────
exports.getCampaignById = async (req, res) => {
  try {
    // Keep this campaign's status current before serving it.
    await expireOverdueCampaigns({ _id: req.params.id });

    const campaign = await Campaign.findById(req.params.id)
      .populate('brandId', 'name');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Expired campaigns are no longer visible to influencers.
    if (campaign.status === 'expired') {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if influencer already applied or was rejected
    let hasApplied = false;
    if (req.userId) {
      const existing = await Application.findOne({
        campaignId: campaign._id,
        influencerId: req.userId
      });
      if (existing?.status === 'rejected') {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      hasApplied = !!existing;
    }

    res.json({ campaign, hasApplied });

  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// APPLY TO CAMPAIGN (influencer)
// ─────────────────────────────────────────
exports.applyToCampaign = async (req, res) => {
  try {
    const { message, proposedRate } = req.body;
    const campaignId = req.params.id;

    // Get campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ error: 'This campaign is no longer accepting applications.' });
    }

    // Block applications once the deadline has passed (campaign is effectively expired).
    if (campaign.deadline && new Date(campaign.deadline).getTime() < Date.now()) {
      return res.status(400).json({ error: "This campaign's deadline has passed — it is no longer accepting applications." });
    }

    // Block if there's already an accepted deal for this campaign
    const Deal = require('../models/Deal');
    const acceptedDeal = await Deal.findOne({ campaignId, status: { $in: ['in-progress', 'content-submitted', 'completed'] } });
    if (acceptedDeal) {
      return res.status(400).json({ error: 'This campaign is no longer accepting applications.' });
    }

    // Check freemium limit — 5 applications per month
    const isPremium = req.user.plan === 'premium';
    if (!isPremium) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const applicationsThisMonth = await Application.countDocuments({
        influencerId: req.userId,
        createdAt: { $gte: startOfMonth }
      });

      if (applicationsThisMonth >= 5) {
        return res.status(403).json({
          error: 'freemium_limit',
          message: 'You have used all 5 free applications this month. Upgrade to Premium for unlimited applications.'
        });
      }
    }

    // Check for duplicate application
    const existing = await Application.findOne({
      campaignId,
      influencerId: req.userId
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already applied to this campaign.' });
    }

    // Create application
    const application = await Application.create({
      campaignId,
      influencerId: req.userId,
      brandId: campaign.brandId,
      message: message || '',
      proposedRate: proposedRate || 0,
      status: 'applied'
    });

    // Increment applicant count on campaign
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { applicantCount: 1 }
    });

    // Confirmation to the influencer (#3) + new-applicant alert to the brand (#9)
    const brand = await User.findById(campaign.brandId).select('name email');
    notify.applicationSubmitted(req.user.email, {
      campaignTitle: campaign.title,
      brandName: brand?.name,
    });
    if (brand?.email) {
      notify.newApplicationToBrand(brand.email, {
        influencerName: req.user.name,
        campaignTitle: campaign.title,
      });
    }

    res.status(201).json({
      message: 'Application submitted successfully. Brand will review within 48 hours.',
      application
    });

  } catch (error) {
    console.error('Apply campaign error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET MY APPLICATIONS (influencer)
// ─────────────────────────────────────────
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      influencerId: req.userId
    })
      .populate('campaignId', 'title niche budgetMin budgetMax deadline status')
      .populate('brandId', 'name')
      .sort({ createdAt: -1 });

    res.json({ applications });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// WITHDRAW APPLICATION (influencer)
// ─────────────────────────────────────────
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Only the influencer who applied can withdraw
    if (application.influencerId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow withdrawal if still in 'applied' state
    if (application.status !== 'applied') {
      return res.status(400).json({ error: 'You can only withdraw applications that are still pending.' });
    }

    await Application.findByIdAndDelete(applicationId);

    // Decrement applicant count on the campaign
    await Campaign.findByIdAndUpdate(application.campaignId, {
      $inc: { applicantCount: -1 }
    });

    res.json({ message: 'Application withdrawn successfully' });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// COUNT NEW CAMPAIGNS SINCE TIMESTAMP (for influencer dot)
// ─────────────────────────────────────────
exports.getNewSinceCount = async (req, res) => {
  try {
    const { since } = req.query;
    if (!since) return res.json({ count: 0 });
    const sinceDate = new Date(parseInt(since));
    if (isNaN(sinceDate.getTime())) return res.json({ count: 0 });

    // Don't count campaigns that have since expired.
    await expireOverdueCampaigns();

    const rejectedApps = await Application.find({
      influencerId: req.userId,
      status: 'rejected'
    }).select('campaignId');
    const rejectedIds = rejectedApps.map(a => a.campaignId);

    const count = await Campaign.countDocuments({
      status: 'active',
      createdAt: { $gt: sinceDate },
      _id: { $nin: rejectedIds }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SEED SAMPLE CAMPAIGNS (for demo/testing)
// ─────────────────────────────────────────
exports.seedCampaigns = async (req, res) => {
  try {
    // Only allow admin to seed
    const existing = await Campaign.countDocuments();
    if (existing > 0) {
      return res.json({ message: `${existing} campaigns already exist. No seeding needed.` });
    }

    const sampleCampaigns = [
      {
        brandId: req.userId,
        title: 'Summer skincare launch',
        description: 'Launching our new hydrating serum for Indian summer. Looking for beauty creators with engaged audiences in metro cities to review the product honestly.',
        niche: ['beauty'],
        deliverables: '2 reels + 3 stories',
        budgetMin: 8000,
        budgetMax: 12000,
        deadline: new Date('2026-06-15'),
        targetCity: ['Delhi', 'Mumbai'],
        targetPlatforms: ['instagram'],
        minFollowers: 10000,
        maxFollowers: 200000,
        status: 'active'
      },
      {
        brandId: req.userId,
        title: 'Monsoon fashion drop',
        description: 'New monsoon collection — waterproof tees, convertible jackets, lightweight trousers. Looking for fashion creators who can shoot outdoor OOTDs.',
        niche: ['fashion'],
        deliverables: '1 reel + 5 photos',
        budgetMin: 15000,
        budgetMax: 20000,
        deadline: new Date('2026-07-01'),
        targetCity: ['all'],
        targetPlatforms: ['instagram', 'facebook'],
        minFollowers: 5000,
        maxFollowers: 150000,
        status: 'active'
      },
      {
        brandId: req.userId,
        title: 'Local cafe review series',
        description: 'We are opening 6 new cafes across Bangalore. Looking for food creators to visit, review honestly, and share their cafe experience.',
        niche: ['food'],
        deliverables: '3 reels',
        budgetMin: 5000,
        budgetMax: 7000,
        deadline: new Date('2026-06-20'),
        targetCity: ['Bangalore'],
        targetPlatforms: ['instagram'],
        minFollowers: 3000,
        maxFollowers: 100000,
        status: 'active'
      },
      {
        brandId: req.userId,
        title: 'Protein powder honest reviews',
        description: 'New plant-based protein. Looking for fitness creators who will try it for 30 days and share honest before and after results.',
        niche: ['fitness'],
        deliverables: '4 reels + long-form video',
        budgetMin: 10000,
        budgetMax: 15000,
        deadline: new Date('2026-07-30'),
        targetCity: ['all'],
        targetPlatforms: ['youtube'],
        minFollowers: 8000,
        maxFollowers: 500000,
        status: 'active'
      },
      {
        brandId: req.userId,
        title: 'New energy drink — Kokum Blast',
        description: 'Launching a new natural energy drink. Want fitness and lifestyle creators to try it during workouts and share the post-drink energy feel.',
        niche: ['fitness', 'lifestyle'],
        deliverables: '2 reels',
        budgetMin: 6000,
        budgetMax: 9000,
        deadline: new Date('2026-06-28'),
        targetCity: ['Mumbai', 'Pune'],
        targetPlatforms: ['instagram', 'youtube'],
        minFollowers: 5000,
        maxFollowers: 120000,
        status: 'active'
      },
      {
        brandId: req.userId,
        title: 'Book launch — The Founder\'s Diary',
        description: 'Startup-focused book launching this June. Looking for creators in the business and tech niches to read and review.',
        niche: ['books', 'lifestyle'],
        deliverables: '1 reel + 2 stories',
        budgetMin: 7000,
        budgetMax: 10000,
        deadline: new Date('2026-07-10'),
        targetCity: ['all'],
        targetPlatforms: [],
        minFollowers: 5000,
        maxFollowers: 0,
        status: 'active'
      }
    ];

    // Use create() (not insertMany) so the pre-save hook runs and each
    // seeded campaign gets a human-readable customId.
    await Campaign.create(sampleCampaigns);

    res.status(201).json({
      message: `${sampleCampaigns.length} sample campaigns created successfully`
    });

  } catch (error) {
    console.error('Seed campaigns error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};