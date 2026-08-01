const User = require('../models/User');
const Payment = require('../models/Payment');
const { PLAN_PRICE } = require('./planPricing');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Single source of truth for "how much Premium revenue is really flowing" —
// used by both the admin Overview dashboard and the Subscriptions page so
// the two can never diverge (previously each had its own flat count × rate
// approximation that silently disagreed with each other and ignored yearly
// billing entirely).
//
// Revenue is derived from each currently-premium user's most representative
// paid Payment, normalizing yearly purchases to a monthly-equivalent so
// amounts stay comparable across billing cycles. Purchases stack additively
// onto premiumUntil rather than replacing each other (see
// applyPremiumUpgrade.js), so a user can hold, say, an active yearly
// purchase and later top up with a monthly one — picking the single most
// *recent* payment would then misclassify a yearly subscriber as monthly.
// A yearly payment is preferred whenever one exists among the user's paid
// payments; only when there's no yearly payment do we fall back to their
// most recent monthly one. Falls back to the flat PLAN_PRICE only for
// premium grants with no matching paid record (e.g. legacy/manual).
async function computePremiumRevenue() {
  const now = new Date();

  const [premiumMembers, lifetimeAgg] = await Promise.all([
    User.find({ plan: 'premium', premiumUntil: { $gt: now } }).select('role premiumStartedAt premiumUntil'),
    // Total, all-time revenue actually collected — not tied to who's still active.
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);
  const lifetimeRevenue = Math.round((lifetimeAgg[0]?.total || 0) / 100);

  const premiumUserIds = premiumMembers.map(u => u._id);
  const latestPaidByUser = await Payment.aggregate([
    { $match: { status: 'paid', userId: { $in: premiumUserIds } } },
    // Yearly payments sort first regardless of date, so $first below picks a
    // user's yearly payment over a chronologically-later monthly top-up;
    // among payments of the same cycle, the most recent one wins.
    { $addFields: { _yearlyFirst: { $cond: [{ $eq: ['$billingCycle', 'yearly'] }, 1, 0] } } },
    { $sort: { _yearlyFirst: -1, createdAt: -1 } },
    { $group: { _id: '$userId', billingCycle: { $first: '$billingCycle' }, amount: { $first: '$amount' } } }
  ]);
  const latestByUser = {};
  latestPaidByUser.forEach(p => { latestByUser[p._id.toString()] = p; });

  const monthlyEquivalentFor = (u) => {
    const latest = latestByUser[u._id.toString()];
    if (!latest) return PLAN_PRICE[u.role] || 0;
    return latest.billingCycle === 'yearly' ? (latest.amount / 100) / 12 : latest.amount / 100;
  };

  let influencerMRR = 0, brandMRR = 0;
  let influencerMonthlyCount = 0, influencerYearlyCount = 0;
  let brandMonthlyCount = 0, brandYearlyCount = 0;
  let premiumInfluencers = 0, premiumBrands = 0;

  premiumMembers.forEach(u => {
    const monthlyEquivalent = monthlyEquivalentFor(u);
    const latest = latestByUser[u._id.toString()];
    if (u.role === 'influencer') {
      premiumInfluencers++;
      influencerMRR += monthlyEquivalent;
      if (latest?.billingCycle === 'yearly') influencerYearlyCount++; else influencerMonthlyCount++;
    } else if (u.role === 'brand') {
      premiumBrands++;
      brandMRR += monthlyEquivalent;
      if (latest?.billingCycle === 'yearly') brandYearlyCount++; else brandMonthlyCount++;
    }
  });

  influencerMRR = Math.round(influencerMRR);
  brandMRR = Math.round(brandMRR);
  const mrr = influencerMRR + brandMRR;
  const arr = mrr * 12;

  // ── Cumulative active Premium revenue over the last 6 months ──
  // Same normalized-monthly-value logic, applied at each month-end for
  // whoever had already upgraded by then (based on premiumStartedAt).
  const allPremiumMembers = await User.find({
    plan: 'premium',
    premiumStartedAt: { $ne: null }
  }).select('role premiumStartedAt');

  const mrrTrend = [];
  for (let i = 5; i >= 0; i--) {
    // Last millisecond of the month i months ago.
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    let monthMrr = 0;
    allPremiumMembers.forEach(u => {
      if (new Date(u.premiumStartedAt) <= monthEnd) {
        monthMrr += monthlyEquivalentFor(u);
      }
    });
    mrrTrend.push({ month: MONTHS[(now.getMonth() - i + 12) % 12], value: Math.round(monthMrr) });
  }

  return {
    premiumInfluencers,
    premiumBrands,
    totalPremium: premiumInfluencers + premiumBrands,
    mrr,
    arr,
    lifetimeRevenue,
    influencerMRR,
    brandMRR,
    influencerMonthlyCount,
    influencerYearlyCount,
    brandMonthlyCount,
    brandYearlyCount,
    mrrTrend
  };
}

module.exports = { computePremiumRevenue };
