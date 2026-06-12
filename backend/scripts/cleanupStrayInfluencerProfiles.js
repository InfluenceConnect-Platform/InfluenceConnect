require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const InfluencerProfile = require('../models/InfluencerProfile');

// One-off cleanup: an InfluencerProfile must only ever belong to a user whose
// role is 'influencer'. Historically a profile could be created for any
// authenticated user (e.g. an admin), which then leaked into brand Discover.
// This removes any profile whose owner is missing or is not an influencer.
async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);

  const influencerIds = await User.find({ role: 'influencer' }).select('_id');
  const allowed = new Set(influencerIds.map(u => String(u._id)));

  const profiles = await InfluencerProfile.find().select('_id userId slug');
  const stray = profiles.filter(p => !p.userId || !allowed.has(String(p.userId)));

  if (stray.length === 0) {
    console.log('No stray influencer profiles found. Nothing to do.');
    process.exit(0);
  }

  console.log(`Found ${stray.length} stray influencer profile(s):`);
  stray.forEach(p => console.log(`  - ${p.slug || '(no slug)'}  userId=${p.userId}`));

  const result = await InfluencerProfile.deleteMany({
    _id: { $in: stray.map(p => p._id) }
  });

  console.log(`Deleted ${result.deletedCount} stray profile(s).`);
  process.exit(0);
}

cleanup().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
