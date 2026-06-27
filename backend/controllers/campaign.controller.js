const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const User = require('../models/User');
const { expireOverdueCampaigns } = require('../utils/expireCampaigns');
const notify = require('../services/email');

// ─────────────────────────────────────────
// RELEVANCE MATCHING
// Build the campaign-match conditions for an influencer profile so they only
// see campaigns relevant to them (and brands only get relevant applicants).
// Each rule is skipped when the profile lacks the data for it, so incomplete
// profiles see more rather than being over-filtered.
// Returns an array of conditions meant to be ANDed into the campaign query.
// ─────────────────────────────────────────
function buildProfileMatchConditions(profile) {
  const conditions = [];
  if (!profile) return conditions;

  // 1. NICHE — campaign niches overlap the influencer's niches (partial match).
  //    Campaigns with no niche set are treated as relevant to everyone.
  const niches = profile.niche ?? [];
  if (niches.length > 0) {
    conditions.push({ $or: [{ niche: { $size: 0 } }, { niche: { $in: niches } }] });
  }

  // 2. BUDGET — the brand must be able to afford the influencer: the campaign's
  //    top budget reaches at least the influencer's price floor. Campaigns that
  //    pay more than the influencer charges are still shown. budgetMax 0 means
  //    the brand left the budget open-ended, so it always qualifies.
  const priceMin = profile.priceRangeMin ?? 0;
  if (priceMin > 0) {
    conditions.push({ $or: [{ budgetMax: 0 }, { budgetMax: { $gte: priceMin } }] });
  }

  // 3. PLATFORMS + FOLLOWERS (coupled, per-platform) — the influencer is
  //    relevant if at least ONE of their platforms is BOTH targeted by the
  //    campaign (or the campaign targets any) AND has a follower count inside
  //    the campaign's requested range. Checking the range against the SAME
  //    platform the campaign targets — not the influencer's biggest platform —
  //    avoids e.g. a YouTube campaign matching someone purely on their Instagram
  //    size. The influencer's platforms are known here, so this still resolves
  //    to a single DB query (an $or over each platform).
  //    A platform with 0/unknown followers isn't gated on the range (it only has
  //    to be targeted), so an unfilled follower count doesn't over-hide.
  //    maxFollowers 0 means the campaign set no upper limit.
  const platforms = (profile.platforms ?? []).filter(p => p.name);
  if (platforms.length > 0) {
    const perPlatform = platforms.map(p => {
      const followers = p.followers || 0;
      const targeted = { $or: [{ targetPlatforms: { $size: 0 } }, { targetPlatforms: p.name }] };
      if (followers <= 0) return targeted;
      return {
        $and: [
          targeted,
          { minFollowers: { $lte: followers } },
          { $or: [{ maxFollowers: 0 }, { maxFollowers: { $gte: followers } }] },
        ],
      };
    });
    conditions.push({ $or: perPlatform });
  }

  // 4. CITY — the influencer's city must be one the campaign targets. Campaigns
  //    that target everyone (no targetCity, or the 'all' sentinel) qualify for
  //    anyone. Skipped when the profile has no city set, so an unfilled city
  //    doesn't over-hide.
  const city = profile.city;
  if (city) {
    conditions.push({
      $or: [
        { targetCity: { $size: 0 } },
        { targetCity: 'all' },
        { targetCity: city },
      ],
    });
  }

  return conditions;
}

// ─────────────────────────────────────────
// MATCH BREAKDOWN
// Describe HOW well a single campaign fits the influencer, for the match badge.
// Returns a per-dimension label and a 0–100 score. A dimension is 'open' when
// the campaign sets no constraint, 'na' when the profile lacks the data to
// judge, and 'full'/'partial'/'none' otherwise. Both 'open' and 'na' count as
// neutral (full credit) so they neither inflate nor unfairly lower the score.
// ─────────────────────────────────────────
function computeCampaignMatch(profile, campaign) {
  if (!profile) return null;

  const niches = profile.niche ?? [];
  const platforms = (profile.platforms ?? []).filter(p => p.name);
  const platformNames = platforms.map(p => p.name);
  const reasons = [];

  // Niche overlap
  let nicheQ = 1, niche = 'na';
  const cNiche = campaign.niche ?? [];
  if (cNiche.length === 0) {
    niche = 'open';
  } else if (niches.length > 0) {
    const matched = cNiche.filter(n => niches.includes(n));
    nicheQ = matched.length / cNiche.length;
    niche = matched.length === cNiche.length ? 'full' : matched.length > 0 ? 'partial' : 'none';
    if (matched.length) reasons.push(`Niche: ${matched.join(', ')}`);
  }

  // Platform overlap
  let platformQ = 1, platform = 'na';
  const cPlat = campaign.targetPlatforms ?? [];
  if (cPlat.length === 0) {
    platform = 'open';
  } else if (platformNames.length > 0) {
    const matched = cPlat.filter(p => platformNames.includes(p));
    platformQ = matched.length / cPlat.length;
    platform = matched.length === cPlat.length ? 'full' : matched.length > 0 ? 'partial' : 'none';
    if (matched.length) reasons.push(`On ${matched.join(', ')}`);
  }

  // Followers — judged on the platforms the campaign targets (or all if it targets any)
  let followersQ = 1, followers = 'na';
  const relevant = cPlat.length ? platforms.filter(p => cPlat.includes(p.name)) : platforms;
  const reach = Math.max(0, ...relevant.map(p => p.followers || 0));
  const min = campaign.minFollowers || 0;
  const max = campaign.maxFollowers || 0;
  if (min === 0 && max === 0) {
    followers = 'open';
  } else if (reach > 0) {
    const inRange = reach >= min && (max === 0 || reach <= max);
    followersQ = inRange ? 1 : 0;
    followers = inRange ? 'full' : 'none';
    if (inRange) reasons.push('Your audience size fits');
  }

  // Budget — can the brand afford the influencer's floor?
  let budgetQ = 1, budget = 'na';
  const priceMin = profile.priceRangeMin ?? 0;
  if (priceMin > 0) {
    const afford = (campaign.budgetMax || 0) === 0 || campaign.budgetMax >= priceMin;
    budgetQ = afford ? 1 : 0;
    budget = afford ? 'full' : 'none';
    if (afford) reasons.push('Budget fits your rate');
  }

  // City — is the influencer in one of the campaign's targeted cities? Campaigns
  // that target everyone ('all' / no city) give full credit to anyone.
  let cityQ = 1, city = 'na';
  const cCities = (campaign.targetCity ?? []).filter(c => c && c !== 'all');
  if (cCities.length === 0) {
    city = 'open';
  } else if (profile.city) {
    const inCity = cCities.includes(profile.city);
    cityQ = inCity ? 1 : 0;
    city = inCity ? 'full' : 'none';
    if (inCity) reasons.push(`Based in ${profile.city}`);
  }

  const score = Math.round(100 * (
    0.30 * nicheQ + 0.20 * cityQ + 0.15 * platformQ + 0.20 * followersQ + 0.15 * budgetQ
  ));

  return { score, niche, city, platform, followers, budget, reasons };
}

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

    // Fetch this influencer's profile for automatic relevance matching
    // (niche, budget vs price card, platforms, follower range).
    const influencerProfile = await InfluencerProfile.findOne({ userId: req.userId })
      .select('niche priceRangeMin platforms city');
    const influencerNiches = influencerProfile?.niche ?? [];

    // Exclude campaigns where this influencer was explicitly rejected
    const rejectedApplications = await Application.find({
      influencerId: req.userId,
      status: 'rejected'
    }).select('campaignId');
    const rejectedCampaignIds = rejectedApplications.map(a => a.campaignId);

    // Build filter query. All relevance and manual-filter rules are ANDed.
    const query = { status: 'active', _id: { $nin: rejectedCampaignIds } };
    const and = buildProfileMatchConditions(influencerProfile);

    // Manual niche filter from the UI narrows further within the influencer's niches
    if (niche) {
      const requestedNiches = niche.split(',');
      // Intersect with influencer's niches so they can't bypass the profile filter
      const allowed = influencerNiches.length > 0
        ? requestedNiches.filter(n => influencerNiches.includes(n))
        : requestedNiches;
      if (allowed.length > 0) {
        and.push({ niche: { $in: allowed } });
      } else if (influencerNiches.length > 0) {
        // Requested niches have no overlap with the influencer's profile niches — no results
        query._id = { $in: [] };
      }
    }

    if (city && city !== 'all') {
      and.push({ $or: [{ targetCity: city }, { targetCity: 'all' }] });
    }

    if (platform && platform !== 'any') {
      // Match campaigns that target this platform, plus campaigns with no
      // platform restriction (empty targetPlatforms = "any platform").
      and.push({ $or: [{ targetPlatforms: { $size: 0 } }, { targetPlatforms: platform }] });
    }

    if (and.length > 0) query.$and = and;

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
        match: computeCampaignMatch(influencerProfile, c),
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

    // Enrich with the brand's public profile fields (website, logo) so the
    // campaign brief can link out to the brand. brandId is populated with the
    // User; the website/logo live on the BrandProfile keyed by that userId.
    const brandProfile = await BrandProfile.findOne(
      { userId: campaign.brandId?._id },
      { logoUrl: 1, website: 1, companyName: 1 }
    );
    const campaignObj = campaign.toObject();
    campaignObj.brandWebsite = brandProfile?.website || '';
    campaignObj.brandLogoUrl = brandProfile?.logoUrl || '';
    campaignObj.brandCompanyName = brandProfile?.companyName || '';

    res.json({ campaign: campaignObj, hasApplied });

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
      .populate('campaignId', 'title niche budgetMin budgetMax deadline status description deliverables targetPlatforms targetCity customId')
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

    // Count only campaigns relevant to this influencer, matching the browse list.
    const influencerProfile = await InfluencerProfile.findOne({ userId: req.userId })
      .select('niche priceRangeMin platforms city');
    const and = buildProfileMatchConditions(influencerProfile);

    const query = {
      status: 'active',
      createdAt: { $gt: sinceDate },
      _id: { $nin: rejectedIds }
    };
    if (and.length > 0) query.$and = and;

    const count = await Campaign.countDocuments(query);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// UNSEEN APPLICATION STATUS UPDATES (influencer Campaigns dot)
// Counts the influencer's applications whose status the brand changed
// (shortlisted / accepted / rejected) since they last opened the Campaigns tab.
// ─────────────────────────────────────────
exports.getApplicationUpdatesSince = async (req, res) => {
  try {
    const { since } = req.query;
    if (!since) return res.json({ count: 0 });
    const sinceDate = new Date(parseInt(since));
    if (isNaN(sinceDate.getTime())) return res.json({ count: 0 });

    const count = await Application.countDocuments({
      influencerId: req.userId,
      status: { $in: ['shortlisted', 'accepted', 'rejected'] },
      statusUpdatedAt: { $gt: sinceDate },
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