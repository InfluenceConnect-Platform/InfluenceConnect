require('dotenv').config();
const mongoose = require('mongoose');

const InfluencerProfile = require('../models/InfluencerProfile');
const Campaign = require('../models/Campaign');
const BrandProfile = require('../models/BrandProfile');
const { NICHES } = require('../utils/niches');

// One-time migration for the niche taxonomy rewrite added 2026-08-08: the
// old flat 28-niche list is replaced by a 9-category > niche > sub-niche
// hierarchy with DIFFERENT niche-level slugs (this is not a superset of the
// old list — it's a different taxonomy, closer to the client's business/
// lifestyle-skewed doc). Existing documents still hold the OLD slugs, which
// no longer validate against the new enum, so every InfluencerProfile.niche,
// Campaign.niche and BrandProfile.industry needs remapping.
//
// A few old niches (cricket, dance) have no reasonable home in the new
// taxonomy — left UNMAPPED (dropped) rather than force a bad guess. Anyone
// who had ONLY an unmapped niche selected ends up with an empty niche array
// and should be nudged to reselect on next profile edit. This script prints
// exactly who that affects so it can be handled manually (email nudge, etc.)
// rather than silently.
//
// Safe to re-run — old slugs are gone after the first pass, so a second run
// is a no-op.

const OLD_TO_NEW = {
  fashion:          'fashion-and-styling',
  beauty:           'beauty-makeup-and-aesthetics',
  tech:             'consumer-electronics-and-hardware',
  gaming:           'gaming-ecosystem',
  food:             'food-discovery-and-criticism',
  travel:           'budget-and-adventure-travel',
  fitness:          'gym-training-and-strength',
  finance:          'personal-finance-and-budgeting',
  comedy:           'comedy-and-relatable-satire',
  education:        'science-history-and-humanities',
  music:            'pop-culture-and-media-commentary',
  lifestyle:        'daily-vlogging-and-aesthetic-living',
  parenting:        'parenting-and-family-dynamics',
  automobiles:      'automotive-and-mechanical',
  photography:      'visual-arts-and-crafting',
  vlogging:         'daily-vlogging-and-aesthetic-living',
  'art-diy':        'visual-arts-and-crafting',
  books:            'pop-culture-and-media-commentary',
  skincare:         'beauty-makeup-and-aesthetics',
  streetwear:       'fashion-and-styling',
  'home-decor':     'home-decor-and-interior-styling',
  pets:             'pet-and-animal-care',
  startups:         'entrepreneurship-and-startups',
  cooking:          'everyday-and-budget-cooking',
  wellness:         'holistic-wellness-and-biohacking',
  'regional-cinema':'pop-culture-and-media-commentary', // low-confidence merge — flagged below
  // cricket, dance: intentionally unmapped — no reasonable home in the new taxonomy
};

function remap(oldNiches) {
  const mapped = new Set();
  const dropped = [];
  for (const n of (oldNiches || [])) {
    const next = OLD_TO_NEW[n];
    if (next && NICHES.includes(next)) mapped.add(next);
    else if (NICHES.includes(n)) mapped.add(n); // already a new-taxonomy slug (re-run safety)
    else dropped.push(n);
  }
  return { mapped: [...mapped], dropped };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Migrating niche taxonomy...');

  let profilesUpdated = 0;
  const emptiedProfiles = [];
  const profiles = await InfluencerProfile.find({}).select('userId niche');
  for (const p of profiles) {
    const { mapped, dropped } = remap(p.niche);
    if (dropped.length) console.log(`  influencer ${p.userId}: dropped [${dropped.join(', ')}]`);
    if (mapped.length === 0 && (p.niche || []).length > 0) emptiedProfiles.push(p.userId.toString());
    await InfluencerProfile.updateOne({ _id: p._id }, { $set: { niche: mapped } });
    profilesUpdated++;
  }

  let campaignsUpdated = 0;
  const campaigns = await Campaign.find({}).select('niche');
  for (const c of campaigns) {
    const { mapped, dropped } = remap(c.niche);
    if (dropped.length) console.log(`  campaign ${c._id}: dropped [${dropped.join(', ')}]`);
    await Campaign.updateOne({ _id: c._id }, { $set: { niche: mapped } });
    campaignsUpdated++;
  }

  let brandsUpdated = 0;
  const brands = await BrandProfile.find({});
  for (const b of brands) {
    if (b.industry === 'other' || NICHES.includes(b.industry)) continue; // already fine
    const { mapped } = remap([b.industry]);
    b.industry = mapped[0] || 'other';
    await b.save();
    brandsUpdated++;
  }

  console.log(`Done. Influencer profiles: ${profilesUpdated} (${emptiedProfiles.length} left with an empty niche — needs manual reselect: ${emptiedProfiles.join(', ') || 'none'}). Campaigns: ${campaignsUpdated}. Brand profiles: ${brandsUpdated}.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
