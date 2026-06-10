const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const Deal = require('../models/Deal');
const Message = require('../models/Message');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const { expireOverdueCampaigns } = require('../utils/expireCampaigns');
const notify = require('../services/email');


// ─────────────────────────────────────────
// OVERVIEW STATS
// ─────────────────────────────────────────
exports.getOverviewStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalInfluencers,
      totalBrands,
      activeCampaigns,
      totalDeals,
      completedDeals,
      premiumUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'influencer' }),
      User.countDocuments({ role: 'brand' }),
      Campaign.countDocuments({ status: 'active' }),
      Deal.countDocuments(),
      Deal.countDocuments({ status: 'completed' }),
      User.countDocuments({ plan: 'premium' })
    ]);

    // Recent signups (with avatars: creator profile pic / brand logo)
    const recentSignupsRaw = await User.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('name email role plan status createdAt');

    const recentInfIds   = recentSignupsRaw.filter(u => u.role === 'influencer').map(u => u._id);
    const recentBrandIds = recentSignupsRaw.filter(u => u.role === 'brand').map(u => u._id);
    const [recentInfProfiles, recentBrandProfiles] = await Promise.all([
      InfluencerProfile.find({ userId: { $in: recentInfIds } }).select('userId profilePicUrl'),
      BrandProfile.find({ userId: { $in: recentBrandIds } }).select('userId logoUrl')
    ]);
    const recentAvatarMap = new Map();
    recentInfProfiles.forEach(p => p.profilePicUrl && recentAvatarMap.set(String(p.userId), p.profilePicUrl));
    recentBrandProfiles.forEach(p => p.logoUrl && recentAvatarMap.set(String(p.userId), p.logoUrl));
    const recentSignups = recentSignupsRaw.map(u => ({
      ...u.toObject(),
      avatarUrl: recentAvatarMap.get(String(u._id)) || ''
    }));

    // MRR calculation
    const influencerPremium = await User.countDocuments({
      role: 'influencer', plan: 'premium'
    });
    const brandPremium = await User.countDocuments({
      role: 'brand', plan: 'premium'
    });

    const influencerMRR = influencerPremium * 299;
    const brandMRR = brandPremium * 1499;
    const mrr = influencerMRR + brandMRR;

    // ── Monthly signup trend (last 6 months, split by role) ──
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendStart = new Date();
    trendStart.setMonth(trendStart.getMonth() - 5);
    trendStart.setDate(1);
    trendStart.setHours(0, 0, 0, 0);

    const signupAgg = await User.aggregate([
      { $match: { createdAt: { $gte: trendStart }, role: { $in: ['influencer', 'brand'] } } },
      { $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, role: '$role' },
          count: { $sum: 1 }
      } }
    ]);

    // Build 6 ordered month buckets and fill counts (0 where none).
    const buckets = [];
    const cursor = new Date(trendStart);
    for (let i = 0; i < 6; i++) {
      buckets.push({
        key: `${cursor.getFullYear()}-${cursor.getMonth() + 1}`,
        month: MONTHS[cursor.getMonth()],
        influencers: 0,
        brands: 0
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const bucketByKey = new Map(buckets.map(b => [b.key, b]));
    signupAgg.forEach(row => {
      const b = bucketByKey.get(`${row._id.y}-${row._id.m}`);
      if (!b) return;
      if (row._id.role === 'influencer') b.influencers = row.count;
      else if (row._id.role === 'brand') b.brands = row.count;
    });
    const signupTrend = buckets.map(({ month, influencers, brands }) => ({ month, influencers, brands }));

    // ── Deal pipeline, campaign status, top niches, revenue trend ──
    const [dealStatusAgg, campaignStatusAgg, nicheAgg, revenueAgg] = await Promise.all([
      Deal.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Campaign.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Campaign.aggregate([
        { $unwind: '$niche' },
        { $group: { _id: '$niche', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      Deal.aggregate([
        { $match: { status: 'completed' } },
        { $addFields: { _at: { $ifNull: ['$completedAt', '$updatedAt'] } } },
        { $match: { _at: { $gte: trendStart } } },
        { $group: {
            _id: { y: { $year: '$_at' }, m: { $month: '$_at' } },
            value: { $sum: '$agreedAmount' }
        } }
      ])
    ]);

    const dealStatus = { 'in-progress': 0, 'content-submitted': 0, completed: 0, cancelled: 0 };
    dealStatusAgg.forEach(r => { if (dealStatus[r._id] !== undefined) dealStatus[r._id] = r.count; });

    const campaignStatus = { draft: 0, active: 0, 'in-progress': 0, completed: 0, closed: 0, expired: 0 };
    campaignStatusAgg.forEach(r => { if (campaignStatus[r._id] !== undefined) campaignStatus[r._id] = r.count; });

    const topNiches = nicheAgg.map(r => ({ niche: r._id, count: r.count }));

    // Revenue trend reuses the same 6 ordered month buckets as signups.
    const revByKey = new Map();
    revenueAgg.forEach(r => revByKey.set(`${r._id.y}-${r._id.m}`, r.value || 0));
    const revenueTrend = buckets.map(b => ({ month: b.month, value: revByKey.get(b.key) || 0 }));

    res.json({
      stats: {
        totalUsers,
        totalInfluencers,
        totalBrands,
        activeCampaigns,
        totalDeals,
        completedDeals,
        premiumUsers,
        mrr,
        influencerMRR,
        brandMRR,
        freemiumUsers: totalUsers - premiumUsers
      },
      recentSignups,
      signupTrend,
      dealStatus,
      campaignStatus,
      topNiches,
      revenueTrend
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET ALL USERS
// ─────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password'),
      User.countDocuments(query)
    ]);

    // Attach each user's avatar (creator profile pic / brand logo) so the
    // table can show real pictures instead of initials.
    const influencerIds = users.filter(u => u.role === 'influencer').map(u => u._id);
    const brandIds      = users.filter(u => u.role === 'brand').map(u => u._id);

    const [infProfiles, brandProfiles] = await Promise.all([
      InfluencerProfile.find({ userId: { $in: influencerIds } }).select('userId profilePicUrl'),
      BrandProfile.find({ userId: { $in: brandIds } }).select('userId logoUrl')
    ]);

    const avatarMap = new Map();
    infProfiles.forEach(p => p.profilePicUrl && avatarMap.set(String(p.userId), p.profilePicUrl));
    brandProfiles.forEach(p => p.logoUrl && avatarMap.set(String(p.userId), p.logoUrl));

    const usersWithAvatar = users.map(u => ({
      ...u.toObject(),
      avatarUrl: avatarMap.get(String(u._id)) || ''
    }));

    res.json({
      users: usersWithAvatar,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET FULL USER DETAILS (360° drawer view)
// Returns User + role-specific profile + campaign/application/deal
// aggregates in a single response so the admin drawer needs one request.
// ─────────────────────────────────────────
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accountAgeDays = Math.max(
      0,
      Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
    );

    // ── INFLUENCER ────────────────────────────────────────────
    if (user.role === 'influencer') {
      const profile = await InfluencerProfile.findOne({ userId });

      // Deals where this user is the influencer
      const [deals, applications] = await Promise.all([
        Deal.find({ influencerId: userId })
          .populate('campaignId', 'title')
          .populate('brandId', 'name')
          .sort({ updatedAt: -1 }),
        Application.find({ influencerId: userId }).select('status')
      ]);

      const activeStatuses = ['in-progress', 'content-submitted'];
      const activeDeals = deals
        .filter(d => activeStatuses.includes(d.status))
        .map(d => ({
          brandName: d.brandId?.name || '—',
          campaignTitle: d.campaignId?.title || '—',
          agreedAmount: d.agreedAmount || 0,
          status: d.status
        }));

      const completedDeals = deals.filter(d => d.status === 'completed');
      const totalEarnings = completedDeals.reduce((sum, d) => sum + (d.agreedAmount || 0), 0);

      const appsAccepted = applications.filter(a => a.status === 'accepted').length;
      const appsRejected = applications.filter(a => a.status === 'rejected').length;
      const appsPending  = applications.length - appsAccepted - appsRejected;

      const platforms = (profile?.platforms || []).map(p => ({
        name: p.name,
        followers: p.followers || 0,
        engagementRate: p.engagementRate || 0
      }));
      const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);

      const portfolioItems = profile?.portfolioItems || [];
      const portfolioVisible = portfolioItems.filter(i => i.isVisible).length;

      return res.json({
        user,
        accountAgeDays,
        avatarUrl: profile?.profilePicUrl || '',
        hasProfile: !!profile,
        influencer: profile ? {
          bio: profile.bio || '',
          niche: profile.niche || [],
          city: profile.city || '',
          priceRangeMin: profile.priceRangeMin || 0,
          priceRangeMax: profile.priceRangeMax || 0,
          credibilityScore: profile.credibilityScore || 0,
          level: profile.level || 'starter',
          slug: profile.slug || '',
          totalFollowers,
          platforms,
          portfolioCount: portfolioItems.length,
          portfolioVisible,
          dealsCompleted: completedDeals.length,
          totalEarnings,
          activeDeals,
          applications: {
            total: applications.length,
            accepted: appsAccepted,
            rejected: appsRejected,
            pending: appsPending
          }
        } : null
      });
    }

    // ── BRAND ─────────────────────────────────────────────────
    if (user.role === 'brand') {
      const profile = await BrandProfile.findOne({ userId });

      const [campaigns, applicationCount, deals] = await Promise.all([
        Campaign.find({ brandId: userId }).select('status'),
        Application.countDocuments({ brandId: userId }),
        Deal.find({ brandId: userId })
          .populate('campaignId', 'title')
          .populate('influencerId', 'name')
          .sort({ updatedAt: -1 })
      ]);

      const campaignsByStatus = { active: 0, draft: 0, closed: 0, completed: 0 };
      campaigns.forEach(c => {
        if (c.status === 'active' || c.status === 'in-progress') campaignsByStatus.active++;
        else if (c.status === 'draft' || c.status === 'expired') campaignsByStatus.draft++;
        else if (c.status === 'closed') campaignsByStatus.closed++;
        else if (c.status === 'completed') campaignsByStatus.completed++;
      });

      const activeStatuses = ['in-progress', 'content-submitted'];
      const activeDeals = deals
        .filter(d => activeStatuses.includes(d.status))
        .map(d => ({
          influencerName: d.influencerId?.name || '—',
          campaignTitle: d.campaignId?.title || '—',
          agreedAmount: d.agreedAmount || 0,
          status: d.status
        }));

      // Money committed across all non-cancelled deals (accepted applications).
      const committedDeals = deals.filter(d => d.status !== 'cancelled');
      const totalCommitted = committedDeals.reduce((sum, d) => sum + (d.agreedAmount || 0), 0);

      // Distinct influencers currently being worked with (active deals).
      const workingWithMap = new Map();
      deals
        .filter(d => activeStatuses.includes(d.status) && d.influencerId)
        .forEach(d => {
          workingWithMap.set(String(d.influencerId._id), d.influencerId.name || '—');
        });
      const workingWith = Array.from(workingWithMap.values());

      return res.json({
        user,
        accountAgeDays,
        avatarUrl: profile?.logoUrl || '',
        hasProfile: !!profile,
        brand: profile ? {
          brandProfileId: profile._id,
          companyName: profile.companyName || '',
          industry: profile.industry || '',
          website: profile.website || '',
          city: profile.city || '',
          gstin: profile.gstin || '',
          gstinStatus: profile.gstinStatus || 'not_submitted',
          gstinVerified: !!profile.gstinVerified,
          campaignsTotal: campaigns.length,
          campaignsByStatus,
          applicationsReceived: applicationCount,
          totalCommitted,
          activeDeals,
          workingWith
        } : null
      });
    }

    // ── ADMIN or other roles ─────────────────────────────────
    return res.json({ user, accountAgeDays, hasProfile: false });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SUSPEND / RESTORE USER
// ─────────────────────────────────────────
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Notify the affected user of the action taken on their account.
    if (status === 'suspended') {
      notify.accountSuspended(user.email, { name: user.name, role: user.role });
    } else {
      notify.accountRestored(user.email, { name: user.name, role: user.role });
    }

    res.json({
      message: `User ${status} successfully`,
      user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET ALL CAMPAIGNS (admin view)
// ─────────────────────────────────────────
exports.getAllCampaigns = async (req, res) => {
  try {
    // Flip any overdue campaigns to 'expired' so the admin view matches the
    // brand view (which runs the same sweep before listing).
    await expireOverdueCampaigns();

    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('brandId', 'name email'),
      Campaign.countDocuments(query)
    ]);

    res.json({
      campaigns,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });

  } catch (error) {
    console.error('Get all campaigns error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET FULL CAMPAIGN DETAILS (360° drawer view)
// Returns the campaign + owning brand + applicant and deal aggregates
// in a single response so the admin drawer needs one request.
// ─────────────────────────────────────────
exports.getCampaignDetails = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId)
      .populate('brandId', 'name email status plan');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const brandUserId = campaign.brandId?._id;

    const [brandProfile, applications, deals] = await Promise.all([
      brandUserId ? BrandProfile.findOne({ userId: brandUserId }) : null,
      Application.find({ campaignId })
        .populate('influencerId', 'name email')
        .sort({ createdAt: -1 }),
      Deal.find({ campaignId })
        .populate('influencerId', 'name')
        .sort({ updatedAt: -1 })
    ]);

    // Applicant avatars (creator profile pics) in one batched query.
    const influencerIds = applications
      .filter(a => a.influencerId)
      .map(a => a.influencerId._id);
    const infProfiles = await InfluencerProfile
      .find({ userId: { $in: influencerIds } })
      .select('userId profilePicUrl slug');
    const picMap  = new Map();
    const slugMap = new Map();
    infProfiles.forEach(p => {
      if (p.profilePicUrl) picMap.set(String(p.userId), p.profilePicUrl);
      if (p.slug)          slugMap.set(String(p.userId), p.slug);
    });

    const appBreakdown = { applied: 0, shortlisted: 0, accepted: 0, rejected: 0, 'on-hold': 0 };
    applications.forEach(a => {
      if (appBreakdown[a.status] !== undefined) appBreakdown[a.status]++;
    });

    const applicants = applications.map(a => ({
      name: a.influencerId?.name || '—',
      email: a.influencerId?.email || '',
      avatarUrl: a.influencerId ? (picMap.get(String(a.influencerId._id)) || '') : '',
      slug: a.influencerId ? (slugMap.get(String(a.influencerId._id)) || '') : '',
      proposedRate: a.proposedRate || 0,
      message: a.message || '',
      status: a.status,
      appliedAt: a.createdAt
    }));

    const activeStatuses = ['in-progress', 'content-submitted'];
    const dealList = deals.map(d => ({
      influencerName: d.influencerId?.name || '—',
      agreedAmount: d.agreedAmount || 0,
      status: d.status,
      isActive: activeStatuses.includes(d.status)
    }));

    // Money committed across all non-cancelled deals; paid = completed only.
    const totalCommitted = deals
      .filter(d => d.status !== 'cancelled')
      .reduce((sum, d) => sum + (d.agreedAmount || 0), 0);
    const totalPaid = deals
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + (d.agreedAmount || 0), 0);

    const daysLive = Math.max(
      0,
      Math.floor((Date.now() - new Date(campaign.createdAt)) / (1000 * 60 * 60 * 24))
    );
    const daysToDeadline = campaign.deadline
      ? Math.ceil((new Date(campaign.deadline) - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      campaign: {
        _id: campaign._id,
        title: campaign.title,
        description: campaign.description || '',
        niche: campaign.niche || [],
        deliverables: campaign.deliverables || '',
        budgetMin: campaign.budgetMin || 0,
        budgetMax: campaign.budgetMax || 0,
        deadline: campaign.deadline,
        targetCity: campaign.targetCity || [],
        targetPlatforms: campaign.targetPlatforms || [],
        minFollowers: campaign.minFollowers || 0,
        maxFollowers: campaign.maxFollowers || 0,
        status: campaign.status,
        applicantCount: campaign.applicantCount || 0,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt
      },
      brand: campaign.brandId ? {
        userId: campaign.brandId._id,
        name: campaign.brandId.name || '—',
        email: campaign.brandId.email || '',
        status: campaign.brandId.status,
        plan: campaign.brandId.plan,
        companyName: brandProfile?.companyName || '',
        industry: brandProfile?.industry || '',
        website: brandProfile?.website || '',
        logoUrl: brandProfile?.logoUrl || '',
        gstinStatus: brandProfile?.gstinStatus || 'not_submitted'
      } : null,
      applications: {
        total: applications.length,
        breakdown: appBreakdown,
        list: applicants
      },
      deals: {
        total: deals.length,
        active: dealList.filter(d => d.isActive).length,
        completed: deals.filter(d => d.status === 'completed').length,
        totalCommitted,
        totalPaid,
        list: dealList
      },
      daysLive,
      daysToDeadline
    });

  } catch (error) {
    console.error('Get campaign details error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// REMOVE CAMPAIGN
// ─────────────────────────────────────────
exports.removeCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'closed') {
      return res.status(400).json({ error: 'This campaign has already been removed.' });
    }
    if (campaign.status === 'completed') {
      return res.status(400).json({ error: 'A completed campaign cannot be removed.' });
    }

    // Real-life guard: once an influencer has submitted content the work is
    // mid-review (and possibly owed payment) — an admin can't simply unwind it.
    const submittedDeal = await Deal.findOne({ campaignId, status: 'content-submitted' });
    if (submittedDeal) {
      return res.status(409).json({
        error: 'Cannot remove — an influencer has already submitted content for this campaign. That deal must be resolved first.'
      });
    }

    // Cancel every in-progress deal and drop a system notice into its chat so
    // the influencer (and brand) understand why the collaboration ended.
    const activeDeals = await Deal.find({ campaignId, status: 'in-progress' });
    const notice = '⚠️ This campaign was removed by an admin, so this collaboration has been cancelled. No further action is needed.';

    for (const deal of activeDeals) {
      deal.status = 'cancelled';
      await deal.save();

      await Message.create({
        dealId: deal._id,
        senderId: deal.brandId,
        receiverId: deal.influencerId,
        content: notice,
        system: true
      });
    }

    // Reject all still-open applications (accepted ones already became deals).
    const appResult = await Application.updateMany(
      { campaignId, status: { $in: ['applied', 'shortlisted', 'on-hold'] } },
      { $set: { status: 'rejected' } }
    );

    // Close the campaign — this is terminal, it can never go active again.
    campaign.status = 'closed';
    await campaign.save();

    // Email the brand owner, and any influencer whose active deal was cancelled.
    const brand = await User.findById(campaign.brandId).select('name email');
    if (brand?.email) {
      notify.campaignRemovedBrand(brand.email, { campaignTitle: campaign.title });
    }
    if (activeDeals.length > 0) {
      const influencers = await User.find({
        _id: { $in: activeDeals.map(d => d.influencerId) }
      }).select('email');
      influencers.forEach(inf => {
        if (inf.email) {
          notify.campaignRemovedInfluencer(inf.email, {
            campaignTitle: campaign.title,
            brandName: brand?.name,
          });
        }
      });
    }

    res.json({
      message: 'Campaign removed successfully',
      dealsCancelled: activeDeals.length,
      applicationsRejected: appResult.modifiedCount || 0
    });

  } catch (error) {
    console.error('Remove campaign error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET GSTIN PENDING VERIFICATIONS
// ─────────────────────────────────────────
exports.getPendingGSTIN = async (req, res) => {
  try {
    const pending = await BrandProfile.find({ gstinStatus: 'pending' })
      .populate('userId', 'name email');

    res.json({ pending });

  } catch (error) {
    console.error('Get pending GSTIN error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// VERIFY / REJECT GSTIN
// ─────────────────────────────────────────
exports.updateGSTINStatus = async (req, res) => {
  try {
    const { brandProfileId } = req.params;
    const { status } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const profile = await BrandProfile.findByIdAndUpdate(brandProfileId, {
      gstinStatus: status,
      gstinVerified: status === 'verified'
    }, { new: true }).populate('userId', 'email');

    // Notify the brand of the verification outcome.
    if (profile?.userId?.email) {
      const payload = { companyName: profile.companyName };
      if (status === 'verified') notify.gstinApproved(profile.userId.email, payload);
      else notify.gstinRejected(profile.userId.email, payload);
    }

    res.json({ message: `GSTIN ${status} successfully` });

  } catch (error) {
    console.error('Update GSTIN error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET SUBSCRIPTION OVERVIEW
// ─────────────────────────────────────────
exports.getSubscriptionOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      premiumInfluencers,
      premiumBrands
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'influencer', plan: 'premium' }),
      User.countDocuments({ role: 'brand', plan: 'premium' })
    ]);

    const mrr = (premiumInfluencers * 299) + (premiumBrands * 1499);
    const freemiumUsers = totalUsers - premiumInfluencers - premiumBrands;

    // ── Cumulative MRR over the last 6 months ──
    // Derived from currently-premium users' start dates: MRR at each month-end
    // is the sum of plan prices for everyone who had upgraded by then.
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const premiumMembers = await User.find({
      plan: 'premium',
      premiumStartedAt: { $ne: null }
    }).select('role premiumStartedAt');

    const mrrTrend = [];
    for (let i = 5; i >= 0; i--) {
      // Last millisecond of the month i months ago.
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      let monthMrr = 0;
      premiumMembers.forEach(u => {
        if (new Date(u.premiumStartedAt) <= monthEnd) {
          monthMrr += u.role === 'brand' ? 1499 : 299;
        }
      });
      mrrTrend.push({ month: MONTHS[(now.getMonth() - i + 12) % 12], value: monthMrr });
    }

    res.json({
      overview: {
        totalUsers,
        premiumInfluencers,
        premiumBrands,
        totalPremium: premiumInfluencers + premiumBrands,
        freemiumUsers,
        mrr,
        influencerMRR: premiumInfluencers * 299,
        brandMRR: premiumBrands * 1499
      },
      mrrTrend
    });

  } catch (error) {
    console.error('Subscription overview error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};