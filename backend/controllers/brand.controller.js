const BrandProfile = require('../models/BrandProfile');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const Deal = require('../models/Deal');
const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');
const { expireOverdueCampaigns } = require('../utils/expireCampaigns');

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
      website, gstin
    } = req.body;

    const profile = await BrandProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (companyName !== undefined) profile.companyName = companyName;
    if (description !== undefined) profile.description = description;
    if (industry !== undefined)    profile.industry = industry;
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
    const {
      title, description, niche, deliverables,
      budgetMin, budgetMax, deadline,
      targetCity, targetPlatform, minFollowers,
      status: requestedStatus
    } = req.body;

    const isDraft = requestedStatus === 'draft';

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Campaign title is required.' });
    }

    // Full validation only required when publishing as active
    if (!isDraft) {
      if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required.' });
      if (!deliverables || !deliverables.trim()) return res.status(400).json({ error: 'Deliverables are required.' });
      if (!deadline) return res.status(400).json({ error: 'Deadline is required.' });
      if (!budgetMin || isNaN(budgetMin) || Number(budgetMin) <= 0) return res.status(400).json({ error: 'Budget min must be a positive number.' });
      if (!budgetMax || isNaN(budgetMax) || Number(budgetMax) <= 0) return res.status(400).json({ error: 'Budget max must be a positive number.' });
    }

    // Freemium limit only applies to active campaigns
    if (!isDraft) {
      const isPremium = req.user.plan === 'premium';
      if (!isPremium) {
        const activeCampaigns = await Campaign.countDocuments({ brandId: req.userId, status: 'active' });
        if (activeCampaigns >= 2) {
          return res.status(403).json({
            error: 'freemium_limit',
            message: 'Upgrade to Premium to create unlimited campaigns.'
          });
        }
      }
    }

    const campaign = await Campaign.create({
      brandId: req.userId,
      title: title.trim(),
      description: description?.trim() || '',
      niche: niche || [],
      deliverables: deliverables?.trim() || '',
      budgetMin: budgetMin || 0,
      budgetMax: budgetMax || 0,
      deadline: deadline || null,
      targetCity: targetCity || ['all'],
      targetPlatform: targetPlatform || 'any',
      minFollowers: minFollowers || 0,
      status: isDraft ? 'draft' : 'active'
    });

    res.status(201).json({
      message: isDraft ? 'Campaign saved as draft.' : 'Campaign created successfully',
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
    // Move this brand's overdue campaigns to 'expired' before listing them.
    await expireOverdueCampaigns({ brandId: req.userId });

    const { status } = req.query;
    const query = { brandId: req.userId };
    if (status) query.status = status;

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    // Attach hasActiveDeal flag so the frontend knows if editing is locked
    const campaignIds = campaigns.map(c => c._id);
    const activeDeals = await Deal.find({
      campaignId: { $in: campaignIds },
      status: { $in: ['in-progress', 'content-submitted', 'completed'] }
    }).select('campaignId');
    const activeDealSet = new Set(activeDeals.map(d => d.campaignId.toString()));

    const enriched = campaigns.map(c => ({
      ...c.toObject(),
      hasActiveDeal: activeDealSet.has(c._id.toString()),
    }));

    res.json({ campaigns: enriched });

  } catch (error) {
    console.error('Get my campaigns error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// UPDATE CAMPAIGN (blocked if deal in-progress)
// ─────────────────────────────────────────
exports.updateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findOne({ _id: campaignId, brandId: req.userId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    // Block edit if any deal for this campaign is active (not cancelled)
    const activeDeal = await Deal.findOne({
      campaignId,
      status: { $in: ['in-progress', 'content-submitted', 'completed'] }
    });

    if (activeDeal) {
      return res.status(403).json({
        error: 'This campaign cannot be edited while a deal is active. Cancel the deal first.'
      });
    }

    const { title, description, niche, deliverables, budgetMin, budgetMax, deadline, targetCity, targetPlatform, minFollowers, status } = req.body;

    // Publishing a draft → active requires full validation + freemium check
    if (status === 'active' && campaign.status === 'draft') {
      if (!title || !title.trim()) return res.status(400).json({ error: 'Campaign title is required.' });
      if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required.' });
      if (!deliverables || !deliverables.trim()) return res.status(400).json({ error: 'Deliverables are required.' });
      if (!deadline) return res.status(400).json({ error: 'Deadline is required.' });
      if (!budgetMin || isNaN(budgetMin) || Number(budgetMin) <= 0) return res.status(400).json({ error: 'Budget min must be a positive number.' });
      if (!budgetMax || isNaN(budgetMax) || Number(budgetMax) <= 0) return res.status(400).json({ error: 'Budget max must be a positive number.' });

      const isPremium = req.user.plan === 'premium';
      if (!isPremium) {
        const activeCampaigns = await Campaign.countDocuments({ brandId: req.userId, status: 'active' });
        if (activeCampaigns >= 2) {
          return res.status(403).json({
            error: 'freemium_limit',
            message: 'Upgrade to Premium to create unlimited campaigns.'
          });
        }
      }
    }

    const updateFields = { title, description, niche, deliverables, budgetMin, budgetMax, deadline, targetCity, targetPlatform, minFollowers };
    if (status === 'active' || status === 'draft') updateFields.status = status;

    const updated = await Campaign.findByIdAndUpdate(
      campaignId,
      updateFields,
      { new: true }
    );

    res.json({ message: 'Campaign updated successfully.', campaign: updated });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// DELETE CAMPAIGN (only if no deal exists)
// ─────────────────────────────────────────
exports.deleteCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findOne({ _id: campaignId, brandId: req.userId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    // Block deletion if a deal has already been created for this campaign
    const existingDeal = await Deal.findOne({ campaignId });
    if (existingDeal) {
      return res.status(400).json({
        error: 'This campaign cannot be deleted because a deal is already in progress. You can cancel the deal first.'
      });
    }

    // Delete all applications and then the campaign
    await Application.deleteMany({ campaignId });
    await Campaign.findByIdAndDelete(campaignId);

    res.json({ message: 'Campaign deleted successfully.' });
  } catch (error) {
    console.error('Delete campaign error:', error);
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

    // Batch-load profiles + deal statuses to avoid a query per application.
    const userIds = applications.map(app => app.influencerId._id);
    const acceptedAppIds = applications
      .filter(app => app.status === 'accepted')
      .map(app => app._id);

    const [profiles, deals] = await Promise.all([
      InfluencerProfile.find({ userId: { $in: userIds } })
        .select('userId niche city platforms profilePicUrl credibilityScore level slug'),
      Deal.find({ applicationId: { $in: acceptedAppIds } }).select('status applicationId'),
    ]);

    const profileByUser = new Map(profiles.map(p => [p.userId.toString(), p]));
    const dealByApp = new Map(deals.map(d => [d.applicationId.toString(), d]));

    const enriched = applications.map(app => ({
      ...app.toObject(),
      influencerProfile: profileByUser.get(app.influencerId._id.toString()) || null,
      dealStatus: app.status === 'accepted'
        ? (dealByApp.get(app._id.toString())?.status ?? null)
        : null,
    }));

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

    // Cannot act on on-hold applications while another deal is active
    if (application.status === 'on-hold') {
      return res.status(400).json({ error: 'This application is on hold while another deal is active for this campaign.' });
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

      // Mark campaign as in-progress while the deal is active
      await Campaign.findByIdAndUpdate(application.campaignId._id, {
        status: 'in-progress'
      });

      // Put all other pending applications on hold (not rejected — reinstated if deal is cancelled)
      await Application.updateMany(
        {
          campaignId: application.campaignId._id,
          _id: { $ne: application._id },
          status: { $in: ['applied', 'shortlisted'] }
        },
        { $set: { status: 'on-hold' } }
      );
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
// GET MY DEALS (for brand messaging inbox)
// ─────────────────────────────────────────
exports.getMyDeals = async (req, res) => {
  try {
    const Message = require('../models/Message');

    const deals = await Deal.find({ brandId: req.userId })
      .populate('campaignId', 'title niche deliverables budgetMin budgetMax')
      .populate('influencerId', 'name')
      .sort({ updatedAt: -1 });

    // Batch the per-deal lookups (profile, last message, unread count) so the
    // inbox costs a fixed number of queries instead of three per deal.
    const dealIds = deals.map(d => d._id);
    const influencerIds = deals.map(d => d.influencerId._id);

    const [profiles, lastMessages, unreadCounts] = await Promise.all([
      InfluencerProfile.find({ userId: { $in: influencerIds } })
        .select('userId niche city platforms profilePicUrl'),
      Message.aggregate([
        { $match: { dealId: { $in: dealIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$dealId', content: { $first: '$content' }, senderId: { $first: '$senderId' }, createdAt: { $first: '$createdAt' } } },
      ]),
      Message.aggregate([
        { $match: { dealId: { $in: dealIds }, receiverId: req.userId, read: false } },
        { $group: { _id: '$dealId', count: { $sum: 1 } } },
      ]),
    ]);

    const profileByUser = new Map(profiles.map(p => [p.userId.toString(), p]));
    const lastMsgByDeal = new Map(lastMessages.map(m => [m._id.toString(), { content: m.content, senderId: m.senderId, createdAt: m.createdAt }]));
    const unreadByDeal = new Map(unreadCounts.map(u => [u._id.toString(), u.count]));

    const dealsWithPreview = deals.map(deal => {
      const obj = deal.toObject();
      return {
        ...obj,
        _id: obj._id.toString(),
        offers: (obj.offers || []).map(o => ({
          ...o,
          _id: o._id.toString(),
          proposedBy: o.proposedBy.toString(),
        })),
        influencerProfile: profileByUser.get(deal.influencerId._id.toString()) || null,
        lastMessage: lastMsgByDeal.get(deal._id.toString()) || null,
        unreadCount: unreadByDeal.get(deal._id.toString()) || 0,
      };
    });

    res.json({ deals: dealsWithPreview });
  } catch (error) {
    console.error('Get brand deals error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// UPDATE DEAL STATUS (brand)
// ─────────────────────────────────────────
exports.updateDealStatus = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { status } = req.body;

    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be completed or cancelled.' });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (deal.brandId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (status === 'completed') {
      if (deal.status !== 'content-submitted') {
        return res.status(400).json({ error: 'Deal must be in content-submitted state to mark complete.' });
      }
      deal.status = 'completed';
      deal.completedAt = new Date();
      await deal.save();

      // Mark campaign as completed
      await Campaign.findByIdAndUpdate(deal.campaignId, { status: 'completed' });

      // Increment dealsCompleted, then recalculate credibility score and level
      const influencerProfile = await InfluencerProfile.findOneAndUpdate(
        { userId: deal.influencerId },
        { $inc: { dealsCompleted: 1 } },
        { new: true }
      );

      if (influencerProfile) {
        influencerProfile.level = influencerProfile.calculateLevel();
        influencerProfile.credibilityScore = influencerProfile.calculateCredibilityScore();
        await influencerProfile.save();
      }
    } else {
      // cancelled
      deal.status = 'cancelled';
      await deal.save();

      // Reopen the campaign
      await Campaign.findByIdAndUpdate(deal.campaignId, { status: 'active' });

      // Restore all on-hold applications back to applied
      await Application.updateMany(
        { campaignId: deal.campaignId, status: 'on-hold' },
        { $set: { status: 'applied' } }
      );

      // Reset the accepted application back to applied as well
      await Application.findByIdAndUpdate(deal.applicationId, { status: 'applied' });
    }

    res.json({ message: `Deal ${status} successfully`, deal });

  } catch (error) {
    console.error('Update deal status (brand) error:', error);
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
      search,
      niche, platform, city,
      minFollowers, maxFollowers,
      minPrice, maxPrice,
      page = 1, limit = 12
    } = req.query;

    const query = {};

    // Free-text search across name (on User), slug, bio, city and niche.
    if (search && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      const matchedUsers = await User.find({ role: 'influencer', name: rx }).select('_id');
      query.$or = [
        { slug: rx },
        { bio: rx },
        { city: rx },
        { niche: rx },
        { userId: { $in: matchedUsers.map(u => u._id) } },
      ];
    }

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

    if (minPrice || maxPrice) {
      // Only match influencers who have set a price (priceRangeMin > 0)
      // and whose range overlaps with the brand's budget:
      //   influencer.priceRangeMin <= brand.maxPrice  (not too expensive)
      //   influencer.priceRangeMax >= brand.minPrice  (not too cheap)
      query.priceRangeMin = { $gt: 0 };
      if (maxPrice) query.priceRangeMin.$lte = parseInt(maxPrice);
      if (minPrice) query.priceRangeMax = { $gte: parseInt(minPrice) };
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
// GET INFLUENCER PUBLIC PROFILE BY SLUG
// ─────────────────────────────────────────
exports.getInfluencerBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const profile = await InfluencerProfile.findOne({ slug })
      .populate('userId', 'name email plan');

    if (!profile) {
      return res.status(404).json({ error: 'Influencer not found.' });
    }

    const visiblePortfolio = profile.getVisiblePortfolio(profile.userId?.plan === 'premium');

    res.json({
      profile: {
        ...profile.toObject(),
        portfolioItems: visiblePortfolio
      }
    });
  } catch (error) {
    console.error('Get influencer by slug error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET BRAND DASHBOARD STATS
// ─────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    // Expire overdue campaigns so the active-campaign count is accurate.
    await expireOverdueCampaigns({ brandId: req.userId });

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

    // Enrich with influencer profiles (single batched query).
    const recentUserIds = recentApplications.map(app => app.influencerId._id);
    const recentProfiles = await InfluencerProfile.find({ userId: { $in: recentUserIds } })
      .select('userId niche city platforms profilePicUrl credibilityScore level');
    const recentProfileByUser = new Map(recentProfiles.map(p => [p.userId.toString(), p]));

    const enrichedApplications = recentApplications.map(app => ({
      ...app.toObject(),
      influencerProfile: recentProfileByUser.get(app.influencerId._id.toString()) || null,
    }));

    // ── Analytics (all real data, aggregated from this brand's records) ──
    const brandId = req.userId;

    // Start of the month 5 months ago → continuous 6-month window.
    const windowStart = new Date();
    windowStart.setMonth(windowStart.getMonth() - 5);
    windowStart.setDate(1);
    windowStart.setHours(0, 0, 0, 0);

    const [appsByMonthRaw, funnelRaw, pipelineRaw, spendRaw] = await Promise.all([
      // Applications per month over the last 6 months
      Application.aggregate([
        { $match: { brandId, createdAt: { $gte: windowStart } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      // Applications by current status (funnel)
      Application.aggregate([
        { $match: { brandId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Deals by status (pipeline)
      Deal.aggregate([
        { $match: { brandId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Agreed deal value per campaign (excluding cancelled), top 6
      Deal.aggregate([
        { $match: { brandId, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$campaignId', amount: { $sum: '$agreedAmount' } } },
        { $sort: { amount: -1 } },
        { $limit: 6 },
        { $lookup: { from: 'campaigns', localField: '_id', foreignField: '_id', as: 'campaign' } },
        { $unwind: '$campaign' },
        { $project: { _id: 0, title: '$campaign.title', amount: 1 } },
      ]),
    ]);

    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthCount = new Map(appsByMonthRaw.map(r => [`${r._id.y}-${r._id.m}`, r.count]));
    const applicationsOverTime = [];
    const cursor = new Date(windowStart);
    for (let i = 0; i < 6; i++) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
      applicationsOverTime.push({ month: MONTH_LABELS[cursor.getMonth()], count: monthCount.get(key) || 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const funnelMap = new Map(funnelRaw.map(r => [r._id, r.count]));
    const pipelineMap = new Map(pipelineRaw.map(r => [r._id, r.count]));

    const analytics = {
      applicationsOverTime,
      funnel: {
        applied: funnelMap.get('applied') || 0,
        shortlisted: funnelMap.get('shortlisted') || 0,
        accepted: funnelMap.get('accepted') || 0,
        rejected: funnelMap.get('rejected') || 0,
      },
      dealPipeline: {
        inProgress: pipelineMap.get('in-progress') || 0,
        contentSubmitted: pipelineMap.get('content-submitted') || 0,
        completed: pipelineMap.get('completed') || 0,
        cancelled: pipelineMap.get('cancelled') || 0,
      },
      spendByCampaign: spendRaw.map(r => ({ title: r.title, amount: r.amount || 0 })),
    };

    res.json({
      stats: {
        activeCampaigns,
        totalApplications,
        activeDeals,
        completedDeals
      },
      analytics,
      recentApplications: enrichedApplications
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};