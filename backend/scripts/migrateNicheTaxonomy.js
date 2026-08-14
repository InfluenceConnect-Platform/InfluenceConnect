require('dotenv').config();
const mongoose = require('mongoose');

const InfluencerProfile = require('../models/InfluencerProfile');
const Campaign = require('../models/Campaign');
const BrandProfile = require('../models/BrandProfile');
const { SUB_NICHE_TO_NICHE } = require('../utils/niches');
const { migrateNicheArray, migrateSubNicheArray, migrateIndustryValue } = require('../utils/nicheMigration');

// One-time migration for the niche taxonomy rewrite added 2026-08-08: the
// old flat 28-niche list is replaced by a 9-category > niche > sub-niche
// hierarchy with DIFFERENT niche-level slugs (this is not a superset of the
// old list — it's a different taxonomy, closer to the client's business/
// lifestyle-skewed doc). Existing documents still hold the OLD slugs, which
// no longer validate against the new enum, so every InfluencerProfile.niche,
// Campaign.niche and BrandProfile.industry needs remapping.
//
// The remap table lives in utils/nicheMigration.js — the same one the live
// controllers use to self-heal a document on its next save — so this script
// and normal runtime traffic can never drift apart onto two different
// mappings for the same old slug.
//
// A couple of old niches (music, dance) have no reasonable home in the new
// taxonomy — left UNMAPPED (dropped) rather than force a bad guess. Anyone
// who had ONLY an unmapped niche selected ends up with an empty niche array
// and should be nudged to reselect on next profile edit. This script prints
// exactly who that affects so it can be handled manually (email nudge, etc.)
// rather than silently.
//
// Safe to re-run — old slugs are gone after the first pass, so a second run
// is a no-op (migrateNicheArray/migrateIndustryValue pass already-current
// values through unchanged).
//
// IMPORTANT: this project has a single Mongo database shared by local dev
// and production (see MONGODB_URI in .env) — there is no separate dev DB to
// test against first. Run with care.

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Migrating niche taxonomy...');

  let profilesUpdated = 0;
  const emptiedProfiles = [];
  const profiles = await InfluencerProfile.find({}).select('userId niche subNiches');
  for (const p of profiles) {
    const before = p.niche || [];
    const mapped = migrateNicheArray(before);
    if (JSON.stringify(before) === JSON.stringify(mapped)) continue; // already current, skip the write
    if (mapped.length === 0 && before.length > 0) emptiedProfiles.push(p.userId.toString());
    console.log(`  influencer ${p.userId}: niche ${JSON.stringify(before)} -> ${JSON.stringify(mapped)}`);
    const newSub = migrateSubNicheArray(p.subNiches);
    await InfluencerProfile.updateOne({ _id: p._id }, { $set: { niche: mapped, subNiches: newSub } });
    profilesUpdated++;
  }

  let campaignsUpdated = 0;
  const campaigns = await Campaign.find({}).select('niche subNiches');
  for (const c of campaigns) {
    const before = c.niche || [];
    const mapped = migrateNicheArray(before);
    if (JSON.stringify(before) === JSON.stringify(mapped)) continue;
    console.log(`  campaign ${c._id}: niche ${JSON.stringify(before)} -> ${JSON.stringify(mapped)}`);
    // Sub-niches must stay under one of the campaign's (possibly remapped) niches.
    const newSub = migrateSubNicheArray(c.subNiches).filter(s => mapped.includes(SUB_NICHE_TO_NICHE[s]));
    await Campaign.updateOne({ _id: c._id }, { $set: { niche: mapped, subNiches: newSub } });
    campaignsUpdated++;
  }

  let brandsUpdated = 0;
  const brands = await BrandProfile.find({});
  for (const b of brands) {
    const before = b.industry;
    const mapped = migrateIndustryValue(before);
    if (before === mapped) continue;
    console.log(`  brand ${b.userId}: industry ${JSON.stringify(before)} -> ${JSON.stringify(mapped)}`);
    b.industry = mapped;
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
