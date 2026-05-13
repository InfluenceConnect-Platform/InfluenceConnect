const cloudinary = require('cloudinary').v2;
const InfluencerProfile = require('../models/InfluencerProfile');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ─────────────────────────────────────────
// GET SIGNATURE
// Frontend uses this to upload directly to Cloudinary
// ─────────────────────────────────────────
exports.getSignature = async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const folder = `influence-connect/portfolio/${req.userId}`;

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder
    });

  } catch (error) {
    console.error('Get signature error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SAVE PORTFOLIO ITEM
// Called after frontend uploads to Cloudinary
// ─────────────────────────────────────────
exports.savePortfolioItem = async (req, res) => {
  try {
    const { cloudinaryUrl, thumbnailUrl, type, fileSize, duration } = req.body;

    if (!cloudinaryUrl || !type) {
      return res.status(400).json({ 
        error: 'cloudinaryUrl and type are required' 
      });
    }

    if (!['image', 'video'].includes(type)) {
      return res.status(400).json({ 
        error: 'type must be image or video' 
      });
    }

    // Find influencer profile
    const profile = await InfluencerProfile.findOne({ 
      userId: req.userId 
    });

    if (!profile) {
      return res.status(404).json({ 
        error: 'Profile not found. Create your profile first.' 
      });
    }

    // Check freemium limits
    const isPremium = req.user.plan === 'premium';
    const currentCount = profile.portfolioItems.length;

    // No upload limit — but track visible items
    // Freemium: unlimited uploads, only 3 visible
    const newItem = {
      type,
      cloudinaryUrl,
      thumbnailUrl: thumbnailUrl || '',
      fileSize: fileSize || 0,
      duration: duration || 0,
      isVisible: currentCount < 3, // first 3 auto-visible
      isPinned: false
    };

    profile.portfolioItems.push(newItem);

    // Recalculate credibility score
    profile.credibilityScore = profile.calculateCredibilityScore();
    profile.level = profile.calculateLevel();

    await profile.save();

    res.status(201).json({
      message: 'Portfolio item saved successfully',
      item: newItem,
      totalItems: profile.portfolioItems.length,
      visibleItems: profile.portfolioItems.filter(i => i.isVisible).length,
      credibilityScore: profile.credibilityScore
    });

  } catch (error) {
    console.error('Save portfolio item error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};