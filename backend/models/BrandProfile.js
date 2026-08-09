const mongoose = require('mongoose');
const { NICHES } = require('../utils/niches');

const brandProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  companyName: {
    type: String,
    default: ''
  },

  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },

  industry: {
    type: String,
    enum: [...NICHES, 'other'],
    default: 'other'
  },

  website: {
    type: String,
    default: ''
  },

  gstin: {
    type: String,
    default: ''
  },

  gstinVerified: {
    type: Boolean,
    default: false
  },

  gstinStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'verified', 'rejected'],
    default: 'not_submitted'
  },

  logoUrl: {
    type: String,
    default: ''
  },

  // Credibility and level — mirrors InfluencerProfile's score/level so
  // influencers can gauge a brand the same way brands gauge influencers.
  score: { type: Number, default: 0 },
  level: {
    type: String,
    enum: ['starter', 'growing', 'professional', 'elite'],
    default: 'starter'
  },

  dealsCompleted: { type: Number, default: 0 }

}, { timestamps: true });

// ─────────────────────────────────────────
// Calculate brand score (0-100)
// Profile completeness (35%) + deals completed (40%) + account age (25%)
// ─────────────────────────────────────────
brandProfileSchema.methods.calculateScore = function() {
  // A — Profile completeness
  let completeness = 0;
  if (this.companyName) completeness += 15;
  if (this.description && this.description.length > 30) completeness += 15;
  if (this.industry && this.industry !== 'other') completeness += 15;
  if (this.website) completeness += 15;
  if (this.logoUrl) completeness += 15;
  if (this.gstinVerified) completeness += 25;
  completeness = Math.min(completeness, 100);

  // B — Deals score
  const dealsScore = Math.min(this.dealsCompleted * 5, 100);

  // C — Account age score
  const daysOld = (Date.now() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24);
  const ageScore = Math.min(Math.round((daysOld / 180) * 100), 100);

  const raw =
    (completeness * 0.35) +
    (dealsScore   * 0.40) +
    (ageScore     * 0.25);

  return Math.min(Math.round(raw), 100);
};

// ─────────────────────────────────────────
// Calculate level based on deals completed — same tiers as InfluencerProfile
// ─────────────────────────────────────────
brandProfileSchema.methods.calculateLevel = function() {
  if (this.dealsCompleted >= 50) return 'elite';
  if (this.dealsCompleted >= 20) return 'professional';
  if (this.dealsCompleted >= 5)  return 'growing';
  return 'starter';
};

module.exports = mongoose.model('BrandProfile', brandProfileSchema);