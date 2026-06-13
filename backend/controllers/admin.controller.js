const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const Deal = require('../models/Deal');
const Message = require('../models/Message');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const AdminLog = require('../models/AdminLog');
const { expireOverdueCampaigns } = require('../utils/expireCampaigns');
const notify = require('../services/email');
const logAdminAction = require('../utils/logAdminAction');

// Best-effort client IP for the audit trail (honours a proxy's X-Forwarded-For).
const getIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.ip ||
  req.socket?.remoteAddress ||
  '';


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
      premiumUsers,
      pendingGstin
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'influencer' }),
      User.countDocuments({ role: 'brand' }),
      Campaign.countDocuments({ status: 'active' }),
      Deal.countDocuments(),
      Deal.countDocuments({ status: 'completed' }),
      User.countDocuments({ plan: 'premium' }),
      BrandProfile.countDocuments({ gstinStatus: 'pending' })
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
        pendingGstin,
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
    const { role, status, plan, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (plan) query.plan = plan;
    if (search) {
      // Escape regex metacharacters so a raw user ID (with its hyphens) and any
      // pasted value are matched literally, not parsed as a pattern.
      const safe = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
        { customId: { $regex: safe, $options: 'i' } }
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
          customId: d.customId || '',
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
          customId: d.customId || '',
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

    // Audit trail.
    await logAdminAction({
      adminId: req.userId,
      adminName: req.user?.name,
      action: status === 'suspended' ? 'USER_SUSPENDED' : 'USER_RESTORED',
      targetType: 'user',
      targetId: user.customId || '',
      targetName: user.name,
      details: `${status === 'suspended' ? 'Suspended' : 'Restored'} ${user.role} account "${user.name}" (${user.email}).`,
      metadata: { newStatus: status, role: user.role, email: user.email },
      ipAddress: getIp(req),
    });

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
      customId: a.customId || '',
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
      customId: d.customId || '',
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
        customId: campaign.customId || '',
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
        flagged: campaign.flagged || false,
        flagReason: campaign.flagReason || '',
        flaggedAt: campaign.flaggedAt || null,
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
    const previousStatus = campaign.status;
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

    // Audit trail.
    await logAdminAction({
      adminId: req.userId,
      adminName: req.user?.name,
      action: 'CAMPAIGN_REMOVED',
      targetType: 'campaign',
      targetId: campaign.customId || '',
      targetName: campaign.title,
      details: `Removed campaign "${campaign.title}"${brand?.name ? ` by ${brand.name}` : ''}. ${activeDeals.length} active deal(s) cancelled, ${appResult.modifiedCount || 0} open application(s) rejected.`,
      metadata: {
        previousStatus,
        newStatus: 'closed',
        dealsCancelled: activeDeals.length,
        applicationsRejected: appResult.modifiedCount || 0,
      },
      ipAddress: getIp(req),
    });

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
// FLAG / UNFLAG CAMPAIGN
// Soft moderation: marks a campaign for review without changing its lifecycle
// status. Reversible — sending again clears the flag. Optional `reason`.
// ─────────────────────────────────────────
exports.flagCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { flagged, reason } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Default behaviour is a toggle, but the client may pass an explicit boolean.
    const next = typeof flagged === 'boolean' ? flagged : !campaign.flagged;

    campaign.flagged    = next;
    campaign.flagReason = next ? (reason || '') : '';
    campaign.flaggedAt  = next ? new Date() : null;
    await campaign.save();

    res.json({
      message: next ? 'Campaign flagged for review.' : 'Campaign flag cleared.',
      flagged: campaign.flagged,
      flagReason: campaign.flagReason,
      flaggedAt: campaign.flaggedAt
    });

  } catch (error) {
    console.error('Flag campaign error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET GSTIN VERIFICATIONS  (counts + filterable list)
// Powers the admin GST Verification panel. `?status=pending|verified|rejected`
// filters the list; counts always cover every state so the tabs stay accurate.
// ─────────────────────────────────────────
exports.getGstinVerifications = async (req, res) => {
  try {
    const { status } = req.query;

    // Only brands that have actually submitted a GSTIN are relevant here.
    const submittedFilter = { gstinStatus: { $in: ['pending', 'verified', 'rejected'] } };

    const listFilter = ['pending', 'verified', 'rejected'].includes(status)
      ? { gstinStatus: status }
      : submittedFilter;

    const [countsAgg, list] = await Promise.all([
      BrandProfile.aggregate([
        { $match: submittedFilter },
        { $group: { _id: '$gstinStatus', count: { $sum: 1 } } },
      ]),
      BrandProfile.find(listFilter)
        .sort({ updatedAt: -1 })
        .populate('userId', 'name email customId status createdAt')
        .select('companyName gstin gstinStatus gstinVerified updatedAt userId'),
    ]);

    const countMap = new Map(countsAgg.map(c => [c._id, c.count]));
    const counts = {
      pending:  countMap.get('pending')  || 0,
      verified: countMap.get('verified') || 0,
      rejected: countMap.get('rejected') || 0,
    };
    counts.total = counts.pending + counts.verified + counts.rejected;

    // Shape the rows the table needs (flatten the populated user).
    const verifications = list.map(p => ({
      brandProfileId: p._id,
      userId:         p.userId?._id || null,
      name:           p.userId?.name || '—',
      email:          p.userId?.email || '',
      customId:       p.userId?.customId || '',
      accountStatus:  p.userId?.status || '',
      companyName:    p.companyName || '',
      gstin:          p.gstin || '',
      gstinStatus:    p.gstinStatus || 'not_submitted',
      submittedAt:    p.userId?.createdAt || null,
      updatedAt:      p.updatedAt,
    }));

    res.json({ counts, verifications });

  } catch (error) {
    console.error('Get GSTIN verifications error:', error);
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
    }, { new: true }).populate('userId', 'email name customId status');

    if (!profile) {
      return res.status(404).json({ error: 'Brand profile not found' });
    }

    // A rejected GSTIN auto-suspends the brand's account as a precaution.
    if (status === 'rejected' && profile.userId && profile.userId.status !== 'suspended') {
      await User.findByIdAndUpdate(profile.userId._id, { status: 'suspended' });
    }

    // Approving a brand that was previously suspended (e.g. an earlier rejection
    // was a mistake) reactivates their account in the same action.
    if (status === 'verified' && profile.userId && profile.userId.status === 'suspended') {
      await User.findByIdAndUpdate(profile.userId._id, { status: 'active' });
    }

    // Notify the brand of the verification outcome.
    if (profile?.userId?.email) {
      const payload = { companyName: profile.companyName };
      if (status === 'verified') notify.gstinApproved(profile.userId.email, payload);
      else notify.gstinRejected(profile.userId.email, payload);
    }

    // Audit trail.
    const brandName = profile?.companyName || profile?.userId?.name || 'Unknown brand';
    await logAdminAction({
      adminId: req.userId,
      adminName: req.user?.name,
      action: status === 'verified' ? 'GSTIN_APPROVED' : 'GSTIN_REJECTED',
      targetType: 'gstin',
      targetId: profile?.userId?.customId || '',
      targetName: brandName,
      details: status === 'verified'
        ? `Approved GSTIN for "${brandName}".`
        : `Rejected GSTIN for "${brandName}" — account suspended.`,
      metadata: { newStatus: status, gstin: profile?.gstin || '' },
      ipAddress: getIp(req),
    });

    res.json({ message: `GSTIN ${status} successfully` });

  } catch (error) {
    console.error('Update GSTIN error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// REOPEN A REJECTED GSTIN  (support flow)
// A rejection suspends the account, so a brand that typed the wrong number
// can't fix it themselves. When they contact support, the admin reopens the
// case here: the account is reactivated and the brand is emailed to resubmit
// the correct GSTIN. The status stays 'rejected' so their profile prompts a
// fresh submission (which moves it back to 'pending' for re-review).
// ─────────────────────────────────────────
exports.reopenGstinRejection = async (req, res) => {
  try {
    const { brandProfileId } = req.params;

    const profile = await BrandProfile.findById(brandProfileId)
      .populate('userId', 'email name customId status');

    if (!profile) {
      return res.status(404).json({ error: 'Brand profile not found' });
    }
    if (profile.gstinStatus !== 'rejected') {
      return res.status(400).json({ error: 'Only a rejected GSTIN can be reopened for resubmission.' });
    }

    // Reactivate the account so the brand can correct their GSTIN.
    if (profile.userId && profile.userId.status === 'suspended') {
      await User.findByIdAndUpdate(profile.userId._id, { status: 'active' });
    }

    if (profile.userId?.email) {
      notify.gstinResubmitRequested(profile.userId.email, { companyName: profile.companyName });
    }

    const brandName = profile.companyName || profile.userId?.name || 'Unknown brand';
    await logAdminAction({
      adminId: req.userId,
      adminName: req.user?.name,
      action: 'USER_RESTORED',
      targetType: 'user',
      targetId: profile.userId?.customId || '',
      targetName: brandName,
      details: `Restored "${brandName}" and requested a GSTIN resubmission.`,
      metadata: { reason: 'gstin_resubmission', gstin: profile.gstin || '' },
      ipAddress: getIp(req),
    });

    res.json({ message: 'Account restored. The brand can now resubmit their GSTIN.' });

  } catch (error) {
    console.error('Reopen GSTIN error:', error);
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

// ─────────────────────────────────────────
// ADMIN ACTIVITY LOG — list (filterable, paginated)
// ─────────────────────────────────────────
exports.getAdminLogs = async (req, res) => {
  try {
    const { action, targetType, startDate, endDate } = req.query;

    let page  = parseInt(req.query.page, 10)  || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const query = {};
    if (action)     query.action = action;
    if (targetType) query.targetType = targetType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        // A date-only value (YYYY-MM-DD) should include the whole day.
        if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AdminLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminLog.countDocuments(query)
    ]);

    res.json({
      logs,
      pagination: { total, page, pages: Math.ceil(total / limit) || 1 }
    });

  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// ADMIN ACTIVITY LOG — summary stats for the page header chips
// ─────────────────────────────────────────
exports.getAdminLogStats = async (req, res) => {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Start of the current week (Monday 00:00).
    const startOfWeek = new Date(startOfToday);
    const day = startOfWeek.getDay();           // 0=Sun … 6=Sat
    const sinceMonday = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - sinceMonday);

    const [todayCount, weekCount, mostCommonAgg, lastLog] = await Promise.all([
      AdminLog.countDocuments({ createdAt: { $gte: startOfToday } }),
      AdminLog.countDocuments({ createdAt: { $gte: startOfWeek } }),
      AdminLog.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      AdminLog.findOne().sort({ createdAt: -1 }).select('createdAt action')
    ]);

    res.json({
      today: todayCount,
      week: weekCount,
      mostCommonAction: mostCommonAgg[0]?._id || null,
      mostCommonCount: mostCommonAgg[0]?.count || 0,
      lastActionAt: lastLog?.createdAt || null
    });

  } catch (error) {
    console.error('Get admin log stats error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};