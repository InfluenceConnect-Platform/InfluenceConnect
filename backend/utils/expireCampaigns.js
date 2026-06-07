const Campaign = require('../models/Campaign');

// A published ('active') campaign that never reached a deal and whose deadline
// has passed is considered "expired". Accepting an applicant/invitation moves a
// campaign to 'in-progress', so those are never touched here — only campaigns
// that are still openly accepting applications get flipped.
//
// This is lazy: callers run it just before reading campaign lists so the
// transition happens without a background cron. Pass an extra filter (e.g.
// { brandId }) to scope the sweep to the records about to be read.
async function expireOverdueCampaigns(extraFilter = {}) {
  await Campaign.updateMany(
    {
      status: 'active',
      deadline: { $ne: null, $lt: new Date() },
      ...extraFilter,
    },
    { $set: { status: 'expired' } }
  );
}

module.exports = { expireOverdueCampaigns };
