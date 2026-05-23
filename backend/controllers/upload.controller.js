const cloudinary = require('cloudinary').v2;
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');

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
    const context = req.query.context || 'portfolio';

    let folder;
    if (context === 'profile-pic') {
      folder = `influence-connect/profile-pics`;
    } else if (context === 'brand-logo') {
      folder = `influence-connect/brand-logos`;
    } else if (context === 'cover-photo') {
      folder = `influence-connect/cover-photos`;
    } else {
      folder = `influence-connect/portfolio/${req.userId}`;
    }

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
// REMOVE PROFILE PICTURE (influencer)
// ─────────────────────────────────────────
exports.removeProfilePicture = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });
    profile.profilePicUrl = '';
    await profile.save();
    res.json({ message: 'Profile picture removed.' });
  } catch (error) {
    console.error('Remove profile picture error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// REMOVE BRAND LOGO
// ─────────────────────────────────────────
exports.removeBrandLogo = async (req, res) => {
  try {
    const profile = await BrandProfile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Brand profile not found.' });
    profile.logoUrl = '';
    await profile.save();
    res.json({ message: 'Brand logo removed.' });
  } catch (error) {
    console.error('Remove brand logo error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SAVE PROFILE PICTURE (influencer)
// ─────────────────────────────────────────
exports.saveProfilePicture = async (req, res) => {
  try {
    const { profilePicUrl } = req.body;
    if (!profilePicUrl) return res.status(400).json({ error: 'profilePicUrl is required.' });

    const profile = await InfluencerProfile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    profile.profilePicUrl = profilePicUrl;
    await profile.save();

    res.json({ message: 'Profile picture updated.', profilePicUrl });
  } catch (error) {
    console.error('Save profile picture error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SAVE BRAND LOGO
// ─────────────────────────────────────────
exports.saveBrandLogo = async (req, res) => {
  try {
    const { logoUrl } = req.body;
    if (!logoUrl) return res.status(400).json({ error: 'logoUrl is required.' });

    const profile = await BrandProfile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Brand profile not found.' });

    profile.logoUrl = logoUrl;
    await profile.save();

    res.json({ message: 'Brand logo updated.', logoUrl });
  } catch (error) {
    console.error('Save brand logo error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SAVE COVER PHOTO (influencer)
// ─────────────────────────────────────────
exports.saveCoverPhoto = async (req, res) => {
  try {
    const { coverPhotoUrl } = req.body;
    if (!coverPhotoUrl) return res.status(400).json({ error: 'coverPhotoUrl is required.' });

    const profile = await InfluencerProfile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    profile.coverPhotoUrl = coverPhotoUrl;
    await profile.save();

    res.json({ message: 'Cover photo updated.', coverPhotoUrl });
  } catch (error) {
    console.error('Save cover photo error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// REMOVE COVER PHOTO (influencer)
// ─────────────────────────────────────────
exports.removeCoverPhoto = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });
    profile.coverPhotoUrl = '';
    await profile.save();
    res.json({ message: 'Cover photo removed.' });
  } catch (error) {
    console.error('Remove cover photo error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// DELETE PORTFOLIO ITEM
// ─────────────────────────────────────────
exports.deletePortfolioItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const profile = await InfluencerProfile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    const item = profile.portfolioItems.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    profile.portfolioItems.pull(itemId);
    profile.credibilityScore = profile.calculateCredibilityScore();
    profile.level = profile.calculateLevel();
    await profile.save();

    res.json({ message: 'Portfolio item deleted.' });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SAVE PORTFOLIO ITEM
// Called after frontend uploads to Cloudinary
// ─────────────────────────────────────────
exports.savePortfolioItem = async (req, res) => {
  try {
    const { cloudinaryUrl, thumbnailUrl, type, fileSize, duration, section } = req.body;

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

    const validSections = ['photos', 'reels', 'products', 'stories'];
    const resolvedSection = validSections.includes(section) ? section : (type === 'video' ? 'reels' : 'photos');

    // Find influencer profile
    const profile = await InfluencerProfile.findOne({ 
      userId: req.userId 
    });

    if (!profile) {
      return res.status(404).json({ 
        error: 'Profile not found. Create your profile first.' 
      });
    }

    const currentCount = profile.portfolioItems.length;

    // Freemium: unlimited uploads, only first 3 marked visible; premium: all visible
    const newItem = {
      type,
      section: resolvedSection,
      cloudinaryUrl,
      thumbnailUrl: thumbnailUrl || '',
      fileSize: fileSize || 0,
      duration: duration || 0,
      isVisible: req.user.plan === 'premium' || currentCount < 3,
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