require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');

// One-time backfill for the 3/4-tier subscription system added 2026-08-08,
// replacing the old binary freemium/premium plan. Existing users default to
// tier: 'free' even if they're currently on the old flat Premium plan —
// this maps them onto the new tiers so nobody silently loses paid access.
//
// Old Premium had no sub-tier, so premium users are mapped to 'silver' (the
// cheapest paid tier for their role) as a conservative baseline — they keep
// paid-tier access without being bumped to the top tier for free. Safe to
// re-run (idempotent — only touches users still at the tier default).

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Backfilling user tiers...');

  const freemiumResult = await User.updateMany(
    { plan: 'freemium', tier: { $in: [null, 'free'] } },
    { $set: { tier: 'free' } }
  );

  const premiumResult = await User.updateMany(
    { plan: 'premium', tier: { $in: [null, 'free'] } },
    { $set: { tier: 'silver' } }
  );

  console.log(`Done. Freemium confirmed: ${freemiumResult.modifiedCount}, Premium mapped to silver: ${premiumResult.modifiedCount}.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
