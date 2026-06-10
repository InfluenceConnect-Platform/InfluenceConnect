const Counter = require('../models/Counter');

// Maps an entity type to its human-readable ID prefix.
// Sequences are kept per-entity so each series counts independently:
//   IC-INF-000001, IC-BRD-000001, IC-CAM-000001, …
const PREFIXES = {
  influencer:  'IC-INF',
  brand:       'IC-BRD',
  admin:       'IC-ADM',
  campaign:    'IC-CAM',
  application: 'IC-APP',
  deal:        'IC-DEL',
};

/**
 * Atomically generate the next formatted customId for an entity.
 *
 * Uses findOneAndUpdate with $inc + upsert so the increment is a single atomic
 * operation in MongoDB — safe under concurrent requests, no duplicate IDs.
 *
 * @param {string} entity - one of: influencer, brand, admin, campaign, application, deal
 * @returns {Promise<string>} e.g. "IC-INF-000001"
 */
async function generateId(entity) {
  const prefix = PREFIXES[entity];
  if (!prefix) {
    throw new Error(`generateId: unknown entity type "${entity}"`);
  }

  const counter = await Counter.findOneAndUpdate(
    { entity },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const padded = String(counter.seq).padStart(6, '0');
  return `${prefix}-${padded}`;
}

module.exports = generateId;
module.exports.PREFIXES = PREFIXES;
