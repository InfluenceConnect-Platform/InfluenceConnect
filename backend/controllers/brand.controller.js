const BrandProfile = require('../models/BrandProfile');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const Deal = require('../models/Deal');
const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');

// ─────────────────────────────────────────
// CREATE BRAND PROFILE
// ─────────────────────────────────────────
exports.createProfile = async (req, res) => {
  try {
    const existing = await BrandProfile.findOne({ userId: req.userId });
    if (existing) {
      return res.status(400).json({ error: 'Profile already exists' });
    }

    const profile = await BrandProfile.create({ userId: req.userId });

    res.status(201).json({
      message: 'Brand profile created successfully',
      profile
    });

  } catch (error) {
    console.error('Create brand profile error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET MY BRAND PROFILE
// ─────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await BrandProfile.findOne({ userId: req.userId })
      .populate('userId', 'name email mobile plan premiumUntil');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });

  } catch (error) {
    console.error('Get brand profile error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// UPDATE BRAND PROFILE
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const {
      companyName, description, industry,
      city, website, gstin
    } = req.body;

    const profile = await BrandProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (companyName !== undefined) profile.companyName = companyName;
    if (description !== undefined) profile.description = description;
    if (industry !== undefined)    profile.industry = industry;
    if (city !== undefined)        profile.city = city;
    if (website !== undefined)     profile.website = website;

    // GSTIN submission — triggers manual admin review
    if (gstin !== undefined && gstin !== profile.gstin) {
      profile.gstin = gstin;
      profile.gstinStatus = 'pending';
      profile.gstinVerified = false;
    }

    await profile.save();

    res.json({
      message: 'Profile updated successfully',
      profile
    });

  } catch (error) {
    console.error('Update brand profile error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// CREATE CAMPAIGN
// ─────────────────────────────────────────
exports.createCampaign = async (req, res) => {
  try {
    const isPremium = req.user.plan === 'premium';

    // Freemium limit — 2 active campaigns
    if (!isPremium) {
      const activeCampaigns = await Campaign.countDocuments({
        brandId: req.userId,
        status: 'active'
      });

      if (activeCampaigns >= 2) {
        return res.status(403).json({
          error: 'freemium_limit',
          message: 'Upgrade to Premium to create unlimited campaigns.'
        });
      }
    }

    const {
      title, description, niche, deliverables,
      budgetMin, budgetMax, deadline,
      targetCity, targetPlatform, minFollowers
    } = req.body;

    const campaign = await Campaign.create({
      brandId: req.userId,
      title,
      description,
      niche,
      deliverables,
      budgetMin,
      budgetMax,
      deadline,
      targetCity: targetCity || ['all'],
      targetPlatform: targetPlatform || 'any',
      minFollowers: minFollowers || 0,
      status: 'active'
    });

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET MY CAMPAIGNS
// ─────────────────────────────────────────
exports.getMyCampaigns = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { brandId: req.userId };
    if (status) query.status = status;

    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 });

    res.json({ campaigns });

  } catch (error) {
    console.error('Get my campaigns error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET APPLICATIONS FOR A CAMPAIGN
// ─────────────────────────────────────────
exports.getCampaignApplications = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.campaignId,
      brandId: req.userId
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const applications = await Application.find({
      campaignId: req.params.campaignId
    })
      .populate('influencerId', 'name')
      .sort({ createdAt: -1 });

    // Get influencer profiles for each application
    const enriched = await Promise.all(
      applications.map(async (app) => {
        const profile = await InfluencerProfile.findOne({
          userId: app.influencerId._id
        });
        return {
          ...app.toObject(),
          influencerProfile: profile
        };
      })
    );

    res.json({ applications: enriched, campaign });

  } catch (error) {
    console.error('Get campaign applications error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// UPDATE APPLICATION STATUS
// ─────────────────────────────────────────
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { applicationId } = req.params;

    if (!['shortlisted', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await Application.findById(applicationId)
      .populate('campaignId');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify brand owns this campaign
    if (application.campaignId.brandId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    application.status = status;
    await application.save();

    // If accepted — create a deal automatically
    if (status === 'accepted') {
      const existingDeal = await Deal.findOne({
        applicationId: application._id
      });

      if (!existingDeal) {
        await Deal.create({
          campaignId: application.campaignId._id,
          applicationId: application._id,
          influencerId: application.influencerId,
          brandId: req.userId,
          agreedAmount: application.proposedRate ||
            application.campaignId.budgetMin,
          status: 'in-progress'
        });
      }
    }

    res.json({
      message: `Application ${status} successfully`,
      application
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// DISCOVER INFLUENCERS
// ─────────────────────────────────────────
exports.discoverInfluencers = async (req, res) => {
  try {
    const isPremium = req.user.plan === 'premium';

    // Freemium — 10 profile views per day
    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const viewsToday = await require('../models/User').countDocuments({
        // Simple view tracking — in production use a separate collection
      });
    }

    const {
      niche, platform, city,
      minFollowers, maxFollowers,
      page = 1, limit = 12
    } = req.query;

    const query = {};

    if (niche) {
      query.niche = { $in: niche.split(',') };
    }

    if (city) {
      query.city = city;
    }

    if (platform) {
      query['platforms.name'] = platform;
    }

    if (minFollowers || maxFollowers) {
      query['platforms.followers'] = {};
      if (minFollowers) query['platforms.followers'].$gte = parseInt(minFollowers);
      if (maxFollowers) query['platforms.followers'].$lte = parseInt(maxFollowers);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [profiles, total] = await Promise.all([
      InfluencerProfile.find(query)
        .sort({ credibilityScore: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name plan'),
      InfluencerProfile.countDocuments(query)
    ]);

    res.json({
      influencers: profiles,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Discover influencers error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET BRAND DASHBOARD STATS
// ─────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      activeCampaigns,
      totalApplications,
      activeDeals,
      completedDeals
    ] = await Promise.all([
      Campaign.countDocuments({ brandId: req.userId, status: 'active' }),
      Application.countDocuments({ brandId: req.userId }),
      Deal.countDocuments({ brandId: req.userId, status: 'in-progress' }),
      Deal.countDocuments({ brandId: req.userId, status: 'completed' })
    ]);

    // Recent applications
    const recentApplications = await Application.find({ brandId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('influencerId', 'name')
      .populate('campaignId', 'title');

    // Enrich with influencer profiles
    const enrichedApplications = await Promise.all(
      recentApplications.map(async (app) => {
        const profile = await InfluencerProfile.findOne({
          userId: app.influencerId._id
        });
        return { ...app.toObject(), influencerProfile: profile };
      })
    );

    res.json({
      stats: {
        activeCampaigns,
        totalApplications,
        activeDeals,
        completedDeals
      },
      recentApplications: enrichedApplications
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};