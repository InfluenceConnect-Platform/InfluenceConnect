const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['instagram', 'youtube', 'facebook'],
    required: true
  },
  followers: { type: Number, default: 0 },
  avgLikes: { type: Number, default: 0 },
  avgComments: { type: Number, default: 0 },
  avgShares: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
  profileUrl: { type: String, default: '' }
}, { _id: false });

const portfolioItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  section: {
    type: String,
    enum: ['photos', 'reels', 'products', 'stories'],
    default: null
  },
  cloudinaryUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const influencerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },

  niche: [{
    type: String,
    enum: [
      'beauty', 'fashion', 'food', 'fitness',
      'lifestyle', 'travel', 'tech', 'books'
    ]
  }],

  city: {
    type: String,
    default: ''
  },

  priceRangeMin: { type: Number, default: 0 },
  priceRangeMax: { type: Number, default: 0 },

  // Platform wise social stats
  platforms: [platformSchema],

  // Portfolio — unlimited uploads, visibility gated
  portfolioItems: [portfolioItemSchema],

  // Credibility and level
  credibilityScore: { type: Number, default: 0 },
  level: {
    type: String,
    enum: ['starter', 'growing', 'professional', 'elite'],
    default: 'starter'
  },

  dealsCompleted: { type: Number, default: 0 },

  profilePicUrl: { type: String, default: '' },
  coverPhotoUrl: { type: String, default: '' },

}, { timestamps: true });

// ─────────────────────────────────────────
// Calculate engagement rate per platform
// ─────────────────────────────────────────
influencerProfileSchema.methods.calculateEngagementRates = function() {
  this.platforms.forEach(platform => {
    if (platform.followers > 0) {
      const totalEngagements = 
        platform.avgLikes + 
        platform.avgComments + 
        platform.avgShares;
      platform.engagementRate = parseFloat(
        ((totalEngagements / platform.followers) * 100).toFixed(1)
      );
    }
  });
};

// ─────────────────────────────────────────
// Get primary platform (highest followers)
// ─────────────────────────────────────────
influencerProfileSchema.methods.getPrimaryPlatform = function() {
  if (!this.platforms || this.platforms.length === 0) return null;
  return this.platforms.reduce((max, platform) =>
    platform.followers > max.followers ? platform : max
  );
};

// ─────────────────────────────────────────
// Calculate credibility score
// ─────────────────────────────────────────
influencerProfileSchema.methods.calculateCredibilityScore = function() {

  // A — Profile completeness (0-100)
  let completeness = 0;
  if (this.bio && this.bio.length > 50) completeness += 15;
  if (this.niche && this.niche.length > 0) completeness += 10;
  if (this.city) completeness += 10;
  if (this.priceRangeMin > 0) completeness += 10;
  if (this.platforms && this.platforms.length > 0) completeness += 10;
  if (this.portfolioItems && this.portfolioItems.length >= 1) completeness += 15;
  if (this.portfolioItems && this.portfolioItems.length >= 3) completeness += 10;
  if (this.slug) completeness += 10;
  completeness = Math.min(completeness, 100);

  // B — Engagement score (0-100)
  const primary = this.getPrimaryPlatform();
  let engagementScore = 0;
  if (primary) {
    const rate = primary.engagementRate;
    if (rate < 1)      engagementScore = Math.round((rate / 1) * 20);
    else if (rate < 2) engagementScore = Math.round(20 + ((rate - 1) / 1) * 20);
    else if (rate < 4) engagementScore = Math.round(40 + ((rate - 2) / 2) * 25);
    else if (rate < 6) engagementScore = Math.round(65 + ((rate - 4) / 2) * 20);
    else if (rate < 8) engagementScore = Math.round(85 + ((rate - 6) / 2) * 10);
    else engagementScore = 100;
  }

  // C — Deals score (0-100)
  const dealsScore = Math.min(this.dealsCompleted * 5, 100);

  // D — Account age score (0-100)
  const daysOld = (Date.now() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24);
  const ageScore = Math.min(Math.round((daysOld / 180) * 100), 100);

  // E — Multi platform bonus
  const activePlatforms = this.platforms 
    ? this.platforms.filter(p => p.followers > 1000).length 
    : 0;
  const platformBonus = activePlatforms >= 3 ? 5 : activePlatforms === 2 ? 2 : 0;

  // Final score
  const raw = 
    (completeness  * 0.25) +
    (engagementScore * 0.30) +
    (dealsScore    * 0.30) +
    (ageScore      * 0.15);

  return Math.min(Math.round(raw + platformBonus), 100);
};

// ─────────────────────────────────────────
// Calculate level based on deals
// ─────────────────────────────────────────
influencerProfileSchema.methods.calculateLevel = function() {
  if (this.dealsCompleted >= 50) return 'elite';
  if (this.dealsCompleted >= 20) return 'professional';
  if (this.dealsCompleted >= 5)  return 'growing';
  return 'starter';
};

// ─────────────────────────────────────────
// Get visible portfolio items
// ─────────────────────────────────────────
influencerProfileSchema.methods.getVisiblePortfolio = function(isPremium) {
  if (isPremium) return this.portfolioItems;
  // For freemium: include ALL items (isVisible or not) so brands see real counts.
  // First 3 (pinned first) are clear; the rest are locked with URLs stripped.
  const pinned  = this.portfolioItems.filter(item => item.isPinned);
  const rest    = this.portfolioItems.filter(item => !item.isPinned);
  const ordered = [...pinned, ...rest];
  return ordered.map((item, i) => {
    const obj = item.toObject();
    if (i >= 3) {
      obj.locked = true;
      // Keep URLs so the frontend can render a blurred preview
    }
    return obj;
  });
};

module.exports = mongoose.model('InfluencerProfile', influencerProfileSchema);