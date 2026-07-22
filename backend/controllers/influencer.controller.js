const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');
const StatsSnapshot = require('../models/StatsSnapshot');
const Deal = require('../models/Deal');
const BrandProfile = require('../models/BrandProfile');
const Message = require('../models/Message');
const Campaign = require('../models/Campaign');
const notify = require('../services/email');
const { postDealNotice } = require('../utils/dealNotice');

// ─────────────────────────────────────────
// Generate slug from name
// ─────────────────────────────────────────
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);
}

async function getUniqueSlug(name) {
  let slug = generateSlug(name);
  let exists = await InfluencerProfile.findOne({ slug });
  let counter = 1;
  while (exists) {
    slug = `${generateSlug(name)}-${counter}`;
    exists = await InfluencerProfile.findOne({ slug });
    counter++;
  }
  return slug;
}

// ─────────────────────────────────────────
// CREATE PROFILE (called after registration)
// ─────────────────────────────────────────
exports.createProfile = async (req, res) => {
  try {
    // Only influencer accounts may own an influencer profile. Without this guard
    // an admin or brand hitting this endpoint would get a profile and then leak
    // into brand Discover results.
    if (req.user.role !== 'influencer') {
      return res.status(403).json({
        error: 'Only influencer accounts can create an influencer profile.'
      });
    }

    // Check profile does not already exist
    const existing = await InfluencerProfile.findOne({
      userId: req.userId
    });
    if (existing) {
      return res.status(400).json({ 
        error: 'Profile already exists' 
      });
    }

    // Generate unique slug from user's name
    const slug = await getUniqueSlug(req.user.name);

    const profile = await InfluencerProfile.create({
      userId: req.userId,
      slug
    });

    res.status(201).json({
      message: 'Profile created successfully',
      profile
    });

  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET MY PROFILE
// ─────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await InfluencerProfile
      .findOne({ userId: req.userId })
      .populate('userId', 'name email mobile plan premiumUntil customId');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const isPremium = req.user.plan === 'premium';
    const primary   = profile.getPrimaryPlatform();

    res.json({
      profile,
      primaryPlatform: primary,
      visiblePortfolio: profile.getVisiblePortfolio(isPremium),
      isPremium
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET STATS HISTORY (real recorded snapshots for dashboard charts)
// ─────────────────────────────────────────
exports.getStatsHistory = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Ensure today's point exists so the charts always reflect the creator's
    // current real stats (and the series grows by one honest point each day).
    await StatsSnapshot.record(profile);

    const snapshots = await StatsSnapshot
      .find({ userId: req.userId })
      .sort({ day: 1 })
      .select('day totalFollowers totalEngagement avgEngagementRate -_id')
      .lean();

    res.json({ snapshots });

  } catch (error) {
    console.error('Get stats history error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, niche, city, priceRangeMin, priceRangeMax, platforms } = req.body;

    const profile = await InfluencerProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Allow editing the influencer's display name (stored on the User). The
    // public profile slug is generated once at profile creation and is NOT
    // regenerated here, so the profile URL stays stable across name changes.
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ error: 'Name cannot be empty.' });
      }
      await User.findByIdAndUpdate(req.userId, { name: trimmedName });
    }

    // Update fields
    if (bio !== undefined)          profile.bio = bio;
    if (niche !== undefined)        profile.niche = niche;
    if (city !== undefined)         profile.city = city;
    if (priceRangeMin !== undefined) profile.priceRangeMin = priceRangeMin;
    if (priceRangeMax !== undefined) profile.priceRangeMax = priceRangeMax;

    // Update platforms and recalculate engagement rates
    if (platforms !== undefined) {
      profile.platforms = platforms;
      profile.calculateEngagementRates();
    }

    // Recalculate credibility score and level
    profile.credibilityScore = profile.calculateCredibilityScore();
    profile.level = profile.calculateLevel();

    await profile.save();

    // Capture today's stats so the dashboard trend charts plot real history.
    // Never let a snapshot hiccup fail the profile update.
    StatsSnapshot.record(profile).catch(err =>
      console.error('Stats snapshot (update) error:', err)
    );

    res.json({
      message: 'Profile updated successfully',
      profile,
      credibilityScore: profile.credibilityScore,
      level: profile.level
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET PUBLIC PROFILE BY SLUG
// ─────────────────────────────────────────
exports.getPublicProfile = async (req, res) => {
  try {
    const { slug } = req.params;

    const profile = await InfluencerProfile
      .findOne({ slug })
      .populate('userId', 'name plan');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const visiblePortfolio = profile.getVisiblePortfolio(profile.userId?.plan === 'premium');
    const primary = profile.getPrimaryPlatform();

    res.json({
      profile: {
        ...profile.toObject(),
        portfolioItems: visiblePortfolio
      },
      primaryPlatform: primary
    });

  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};


// ─────────────────────────────────────────
// GET MY DEALS (for messaging inbox)
// ─────────────────────────────────────────
exports.getMyDeals = async (req, res) => {
  try {
    const deals = await Deal.find({ influencerId: req.userId })
      .populate('campaignId', 'title niche deliverables budgetMin budgetMax')
      .populate('brandId', 'name')
      .sort({ updatedAt: -1 });

    // Batch the per-deal lookups (brand logo, last message, unread count) so the
    // inbox costs a fixed number of queries instead of three per deal.
    const dealIds = deals.map(d => d._id);
    // brandId is populated, so reach for ._id to get the raw ObjectId for lookups.
    const brandIds = deals.map(d => d.brandId?._id || d.brandId);

    const [brandProfiles, lastMessages, unreadCounts] = await Promise.all([
      BrandProfile.find({ userId: { $in: brandIds } }).select('logoUrl userId'),
      Message.aggregate([
        { $match: { dealId: { $in: dealIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$dealId', content: { $first: '$content' }, attachments: { $first: '$attachments' }, senderId: { $first: '$senderId' }, createdAt: { $first: '$createdAt' } } },
      ]),
      Message.aggregate([
        { $match: { dealId: { $in: dealIds }, receiverId: req.userId, read: false } },
        { $group: { _id: '$dealId', count: { $sum: 1 } } },
      ]),
    ]);

    const logoByBrand = new Map(brandProfiles.map(b => [b.userId.toString(), b.logoUrl || '']));
    const lastMsgByDeal = new Map(lastMessages.map(m => [m._id.toString(), { content: m.content, attachments: m.attachments || [], senderId: m.senderId, createdAt: m.createdAt }]));
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
        brandLogoUrl: logoByBrand.get((deal.brandId?._id || deal.brandId).toString()) || '',
        lastMessage: lastMsgByDeal.get(deal._id.toString()) || null,
        unreadCount: unreadByDeal.get(deal._id.toString()) || 0,
      };
    });

    // Most recent activity first — a new message should bump the conversation
    // to the top even though it doesn't touch the Deal document itself.
    dealsWithPreview.sort((a, b) => {
      const aTime = Math.max(new Date(a.updatedAt).getTime(), a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0);
      const bTime = Math.max(new Date(b.updatedAt).getTime(), b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0);
      return bTime - aTime;
    });

    res.json({ deals: dealsWithPreview });
  } catch (error) {
    console.error('Get influencer deals error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// UPDATE DEAL STATUS (influencer)
// ─────────────────────────────────────────
exports.updateDealStatus = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { status } = req.body;

    if (status !== 'content-submitted') {
      return res.status(400).json({ error: 'Influencers can only Mark As Done (content-submitted).' });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (deal.influencerId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (deal.status !== 'in-progress') {
      return res.status(400).json({ error: 'Deal must be in-progress to submit content.' });
    }

    deal.status = 'content-submitted';
    await deal.save();

    // Prompt the brand to review & approve the submitted content (#12)
    const [brand, campaign] = await Promise.all([
      User.findById(deal.brandId).select('email'),
      Campaign.findById(deal.campaignId).select('title'),
    ]);
    if (brand?.email) {
      notify.contentSubmittedBrand(brand.email, {
        influencerName: req.user.name,
        campaignTitle: campaign?.title,
      });
    }

    // In-chat notice so the brand's Messages dot lights up.
    await postDealNotice({
      dealId: deal._id,
      senderId: req.userId,
      receiverId: deal.brandId,
      content: `📦 ${req.user.name} marked the content as done. Please review and approve to complete the deal.`,
      actorContent: `📦 You marked the content as done. The brand will review it.`,
    });

    res.json({ message: 'Content submitted successfully', deal });

  } catch (error) {
    console.error('Update deal status (influencer) error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET EARNINGS
// ─────────────────────────────────────────
exports.getEarnings = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ userId: req.userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Fetch all deals for this influencer
    const allDeals = await Deal.find({ influencerId: req.userId })
      .populate('campaignId', 'title customId niche description deliverables')
      .populate('brandId', 'name email');

    // Brand logos live on BrandProfile, keyed by the brand's userId. Batch-fetch
    // them once so the deal history can show real logos (with a letter fallback).
    const brandIds = [...new Set(allDeals.map(d => (d.brandId?._id || d.brandId)?.toString()).filter(Boolean))];
    const brandProfiles = await BrandProfile.find({ userId: { $in: brandIds } }).select('logoUrl userId');
    const logoByBrand = new Map(brandProfiles.map(b => [b.userId.toString(), b.logoUrl || '']));

    const completedDeals = allDeals.filter(d => d.status === 'completed');
    const activeDeals = allDeals.filter(d => ['in-progress', 'content-submitted'].includes(d.status));
    const pendingPayoutDeals = allDeals.filter(d => d.status === 'content-submitted');

    const totalEarnings = completedDeals.reduce((sum, d) => sum + (d.agreedAmount || 0), 0);
    const pendingPayout = pendingPayoutDeals.reduce((sum, d) => sum + (d.agreedAmount || 0), 0);
    const dealsCompleted = completedDeals.length;
    const avgDealValue = dealsCompleted > 0 ? Math.round(totalEarnings / dealsCompleted) : 0;

    // Last 6 months trend
    const monthlyTrend = generateEmptyMonthlyTrend();
    completedDeals.forEach(deal => {
      if (!deal.completedAt) return;
      const completedDate = new Date(deal.completedAt);
      const monthIdx = monthlyTrend.findIndex(m => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - monthlyTrend.indexOf(m)));
        return (
          completedDate.getMonth() === new Date(d).getMonth() &&
          completedDate.getFullYear() === new Date(d).getFullYear()
        );
      });
      if (monthIdx !== -1) {
        monthlyTrend[monthIdx].earnings += deal.agreedAmount || 0;
        monthlyTrend[monthIdx].deals += 1;
      }
    });

    // Rebuild monthly trend properly
    const trend = buildMonthlyTrend(completedDeals);

    // Deal history
    const dealHistory = completedDeals.map(d => ({
      _id: d._id,
      customId: d.customId || '',
      campaignId: d.campaignId?._id || d.campaignId,
      campaignCustomId: d.campaignId?.customId || '',
      campaignTitle: d.campaignId?.title || 'Campaign',
      campaignDescription: d.campaignId?.description || '',
      deliverables: d.campaignId?.deliverables || '',
      niche: d.campaignId?.niche || [],
      brandName: d.brandId?.name || 'Brand',
      brandEmail: d.brandId?.email || '',
      brandLogoUrl: logoByBrand.get((d.brandId?._id || d.brandId)?.toString()) || '',
      category: d.campaignId?.niche?.[0] || '',
      status: d.status,
      amount: d.agreedAmount || 0,
      startedAt: d.startedAt,
      completedAt: d.completedAt
    }));

    res.json({
      summary: {
        totalEarnings,
        activeDeals: activeDeals.length,
        pendingPayout,
        dealsCompleted,
        avgDealValue
      },
      monthlyTrend: trend,
      categoryBreakdown: [],
      dealHistory
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// Build last 6 months earnings trend from completed deals
function buildMonthlyTrend(completedDeals) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    months.push({
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      monthNum: date.getMonth(),
      earnings: 0,
      deals: 0
    });
  }

  completedDeals.forEach(deal => {
    if (!deal.completedAt) return;
    const d = new Date(deal.completedAt);
    const entry = months.find(m => m.monthNum === d.getMonth() && m.year === d.getFullYear());
    if (entry) {
      entry.earnings += deal.agreedAmount || 0;
      entry.deals += 1;
    }
  });

  // Remove internal monthNum before returning
  return months.map(({ monthNum, ...rest }) => rest);
}

// Generate last 6 months with zero earnings (kept for backward compat)
function generateEmptyMonthlyTrend() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push({
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      earnings: 0,
      deals: 0
    });
  }
  return months;
}