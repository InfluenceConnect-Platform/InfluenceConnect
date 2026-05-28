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

    res.json({
      users,
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