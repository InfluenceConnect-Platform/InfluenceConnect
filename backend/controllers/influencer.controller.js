const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');

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
      .populate('userId', 'name email mobile plan premiumUntil');

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
// UPDATE PROFILE
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { bio, niche, city, priceRangeMin, priceRangeMax, platforms } = req.body;

    const profile = await InfluencerProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
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
   try {
  profile.credibilityScore = profile.calculateCredibilityScore();
  profile.level = profile.calculateLevel();
} catch(e) {
  console.log('Score calculation error:', e.message);
}
    profile.level = profile.calculateLevel();

    await profile.save();

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
      .populate('userId', 'name');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Public profile only shows 3 portfolio items
    const visiblePortfolio = profile.getVisiblePortfolio(false);
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
// GET EARNINGS
// ─────────────────────────────────────────
exports.getEarnings = async (req, res) => {
  try {
    const Deal = require('../models/Deal');

    // For now since Deal model is not built yet,
    // we return a structured empty response
    // This gets populated when deals module is built in Week 4

    const profile = await InfluencerProfile.findOne({ userId: req.userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      summary: {
        totalEarnings: 0,
        activeDeals: 0,
        pendingPayout: 0,
        dealsCompleted: profile.dealsCompleted || 0,
        avgDealValue: 0
      },
      monthlyTrend: generateEmptyMonthlyTrend(),
      categoryBreakdown: [],
      dealHistory: []
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// Generate last 6 months with zero earnings
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