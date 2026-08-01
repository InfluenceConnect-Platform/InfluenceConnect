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
// Revenue is derived from EVERY paid Payment a currently-premium user holds,
// normalizing each one to a monthly-equivalent and summing them — not from
// picking a single "representative" payment. Purchases stack additively onto
// premiumUntil rather than replacing each other (see applyPremiumUpgrade.js),
// so a user can genuinely hold both an active yearly purchase and a monthly
// top-up bought on top of it; neither cycle is favored over the other, both
// are counted, because both were actually paid. Falls back to the flat
// PLAN_PRICE only for premium grants with no matching paid record at all
// (e.g. legacy/manual).
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
  const paidPayments = await Payment.find({
    status: 'paid',
    userId: { $in: premiumUserIds }
  }).select('userId billingCycle amount');

  const paymentsByUser = {};
  paidPayments.forEach(p => {
    const key = p.userId.toString();
    (paymentsByUser[key] || (paymentsByUser[key] = [])).push(p);
  });

  // Sum of every paid payment's monthly-equivalent value for this user.
  const monthlyEquivalentFor = (u) => {
    const payments = paymentsByUser[u._id.toString()];
    if (!payments || payments.length === 0) return PLAN_PRICE[u.role] || 0;
    return payments.reduce((sum, p) => sum + (p.billingCycle === 'yearly' ? (p.amount / 100) / 12 : p.amount / 100), 0);
  };

  // Which billing cycles this user actually has an active paid payment for —
  // can be both, so a user can count toward both the monthly and yearly
  // subscriber tallies at once.
  const cyclesFor = (u) => {
    const payments = paymentsByUser[u._id.toString()];
    if (!payments || payments.length === 0) return new Set();
    return new Set(payments.map(p => p.billingCycle));
  };

  let influencerMRR = 0, brandMRR = 0;
  let influencerMonthlyCount = 0, influencerYearlyCount = 0;
  let brandMonthlyCount = 0, brandYearlyCount = 0;
  let premiumInfluencers = 0, premiumBrands = 0;

  premiumMembers.forEach(u => {
    const monthlyEquivalent = monthlyEquivalentFor(u);
    const cycles = cyclesFor(u);
    // No paid record at all (legacy/manual grant) — default to the monthly
    // bucket, same as the previous fallback behavior.
    const hasMonthly = cycles.has('monthly') || cycles.size === 0;
    const hasYearly = cycles.has('yearly');

    if (u.role === 'influencer') {
      premiumInfluencers++;
      influencerMRR += monthlyEquivalent;
      if (hasMonthly) influencerMonthlyCount++;
      if (hasYearly) influencerYearlyCount++;
    } else if (u.role === 'brand') {
      premiumBrands++;
      brandMRR += monthlyEquivalent;
      if (hasMonthly) brandMonthlyCount++;
      if (hasYearly) brandYearlyCount++;
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
