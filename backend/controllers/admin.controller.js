const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const Deal = require('../models/Deal');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');


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

    // Recent signups
    const recentSignups = await User.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('name email role plan status createdAt');

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
      recentSignups
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
// REMOVE CAMPAIGN
// ─────────────────────────────────────────
exports.removeCampaign = async (req, res) => {
  try {
    await Campaign.findByIdAndUpdate(req.params.campaignId, {
      status: 'closed'
    });

    res.json({ message: 'Campaign removed successfully' });

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

    await BrandProfile.findByIdAndUpdate(brandProfileId, {
      gstinStatus: status,
      gstinVerified: status === 'verified'
    });

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
      }
    });

  } catch (error) {
    console.error('Subscription overview error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};