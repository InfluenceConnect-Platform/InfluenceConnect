require('dotenv').config();
const mongoose = require('mongoose');

const BrandProfile = require('../models/BrandProfile');
const Deal = require('../models/Deal');

// One-time backfill for the brand score/level feature added 2026-08-08.
// Existing BrandProfile docs default to dealsCompleted: 0 / score: 0 /
// level: 'starter' even for brands that already have a deal history —
// this recomputes dealsCompleted from real completed Deals, then derives
// score and level from it. Safe to re-run (idempotent).

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Backfilling brand score/level...');

  const profiles = await BrandProfile.find({});
  let updated = 0;

  for (const profile of profiles) {
    const dealsCompleted = await Deal.countDocuments({ brandId: profile.userId, status: 'completed' });
    profile.dealsCompleted = dealsCompleted;
    profile.level = profile.calculateLevel();
    profile.score = profile.calculateScore();
    await profile.save();
    updated++;
  }

  console.log(`Done. Updated ${updated} brand profile(s).`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
