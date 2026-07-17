const mongoose = require('mongoose');

// A point-in-time record of an influencer's headline stats, captured so the
// dashboard charts can plot a REAL trend over time (engagement rate + reach)
// instead of synthesizing one. One row per influencer per day — re-capturing
// the same day overwrites it with the latest values (upsert), so the series
// has exactly one honest data point per calendar day.
//
// History only accrues going forward: there is no past data to backfill, so
// charts start with a single point (today) and fill in as days pass.
const statsSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Local midnight of the capture day — the dedup bucket.
  day: {
    type: Date,
    required: true
  },

  // Follower count of the influencer's largest connected platform = total reach.
  // Not a cross-platform sum: summing followers double-counts anyone who
  // follows the creator on more than one platform, so we use the single
  // biggest audience as the reach figure instead.
  totalFollowers: { type: Number, default: 0 },

  // Sum of avg interactions per post (likes + comments + shares) across platforms.
  totalEngagement: { type: Number, default: 0 },

  // Mean engagement rate across platforms, in percent (1 decimal).
  avgEngagementRate: { type: Number, default: 0 },

  // Wall-clock time of the most recent capture for this day.
  capturedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// One snapshot per (influencer, day); also serves time-ordered history reads.
statsSnapshotSchema.index({ userId: 1, day: 1 }, { unique: true });

// Derive headline metrics from a profile doc and upsert today's snapshot.
// Idempotent within a day, so it's safe to call on every profile update and on
// every history read. Returns the snapshot doc.
statsSnapshotSchema.statics.record = function (profile) {
  if (!profile) return Promise.resolve(null);

  const platforms = profile.platforms || [];
  const totalFollowers = platforms.length
    ? Math.max(...platforms.map(p => p.followers || 0))
    : 0;
  const totalEngagement = platforms.reduce(
    (s, p) => s + (p.avgLikes || 0) + (p.avgComments || 0) + (p.avgShares || 0),
    0
  );
  const avgEngagementRate = platforms.length
    ? Math.round((platforms.reduce((s, p) => s + (p.engagementRate || 0), 0) / platforms.length) * 10) / 10
    : 0;

  const day = new Date();
  day.setHours(0, 0, 0, 0);

  return this.findOneAndUpdate(
    { userId: profile.userId, day },
    { $set: { totalFollowers, totalEngagement, avgEngagementRate, capturedAt: new Date() } },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('StatsSnapshot', statsSnapshotSchema);
