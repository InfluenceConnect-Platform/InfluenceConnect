const mongoose = require('mongoose');

// Records that a brand opened a specific influencer's full profile on a given
// day. Used to enforce the freemium "10 profiles/day" discovery limit: a brand
// can open 10 *distinct* profiles per day, and re-opening one already seen today
// is free (deduped). Premium brands are never tracked here.
//
// `day` is stored as that day's local midnight Date so all opens on the same
// calendar day collapse to one bucket.
const profileViewSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfluencerProfile',
    required: true
  },

  day: {
    type: Date,
    required: true
  }

}, { timestamps: true });

// One row per (brand, profile, day) — makes the upsert idempotent and dedups
// repeat opens of the same profile within a day.
profileViewSchema.index({ brandId: 1, profileId: 1, day: 1 }, { unique: true });
// Fast count of distinct profiles a brand has opened today.
profileViewSchema.index({ brandId: 1, day: 1 });

module.exports = mongoose.model('ProfileView', profileViewSchema);
