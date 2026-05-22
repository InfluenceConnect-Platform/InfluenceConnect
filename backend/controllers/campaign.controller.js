const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');

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

    // Build filter query
    const query = { status: 'active' };

    if (niche) {
      query.niche = { $in: niche.split(',') };
    }

    if (city && city !== 'all') {
      query.$or = [
        { targetCity: city },
        { targetCity: 'all' }
      ];
    }

    if (platform && platform !== 'any') {
      query.targetPlatform = { $in: [platform, 'any'] };
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
    const campaign = await Campaign.findById(req.params.id)
      .populate('brandId', 'name');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if influencer already applied
    let hasApplied = false;
    if (req.userId) {
      const existing = await Application.findOne({
        campaignId: campaign._id,
        influencerId: req.userId
      });
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
    const count = await Campaign.countDocuments({ status: 'active', createdAt: { $gt: sinceDate } });
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
        targetPlatform: 'instagram',
        minFollowers: 10000,
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
        targetPlatform: 'instagram',
        minFollowers: 5000,
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
        targetPlatform: 'instagram',
        minFollowers: 3000,
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
        targetPlatform: 'youtube',
        minFollowers: 8000,
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
        targetPlatform: 'instagram',
        minFollowers: 5000,
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
        targetPlatform: 'any',
        minFollowers: 5000,
        status: 'active'
      }
    ];

    await Campaign.insertMany(sampleCampaigns);

    res.status(201).json({
      message: `${sampleCampaigns.length} sample campaigns created successfully`
    });

  } catch (error) {
    console.error('Seed campaigns error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};