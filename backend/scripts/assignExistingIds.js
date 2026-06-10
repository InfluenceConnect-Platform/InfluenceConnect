require('dotenv').config();
const mongoose = require('mongoose');

const User        = require('../models/User');
const Campaign    = require('../models/Campaign');
const Application = require('../models/Application');
const Deal        = require('../models/Deal');
const generateId  = require('../utils/generateId');

// One-time backfill: assign a human-readable customId to every existing
// document that doesn't already have one. Safe to re-run — documents that
// already have a customId are skipped, so it's idempotent.
//
// We sort by creation order (createdAt, then _id) so the oldest records get
// the lowest sequence numbers, and we write with updateOne to avoid re-running
// model validators / hooks on legacy data.

const missing = { $or: [{ customId: { $exists: false } }, { customId: null }, { customId: '' }] };

async function backfillUsers() {
  // Users are role-specific (influencer / brand / admin), so the entity passed
  // to generateId depends on each user's role.
  const users = await User.find(missing).sort({ createdAt: 1, _id: 1 }).select('_id role');
  let count = 0;
  for (const u of users) {
    if (!u.role) {
      console.warn(`  ⚠ user ${u._id} has no role — skipped`);
      continue;
    }
    const customId = await generateId(u.role);
    await User.updateOne({ _id: u._id }, { $set: { customId } });
    count++;
  }
  console.log(`  Users:        ${count} assigned`);
  return count;
}

async function backfillFixed(Model, entity, label) {
  const docs = await Model.find(missing).sort({ createdAt: 1, _id: 1 }).select('_id');
  let count = 0;
  for (const d of docs) {
    const customId = await generateId(entity);
    await Model.updateOne({ _id: d._id }, { $set: { customId } });
    count++;
  }
  console.log(`  ${label.padEnd(13)} ${count} assigned`);
  return count;
}

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('✗ MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Assigning customIds to existing records…\n');

  try {
    await backfillUsers();
    await backfillFixed(Campaign,    'campaign',    'Campaigns:');
    await backfillFixed(Application, 'application', 'Applications:');
    await backfillFixed(Deal,        'deal',        'Deals:');
    console.log('\n✓ Migration complete.');
  } catch (err) {
    console.error('\n✗ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
