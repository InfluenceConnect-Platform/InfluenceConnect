const User = require('../models/User');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const { getTierConfig, TIERS_BY_ROLE } = require('./tiers');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Single source of truth for "how much Premium revenue is really flowing" —
// used by both the admin Overview dashboard and the Subscriptions page so
// the two can never diverge (previously each had its own flat count × rate
// approximation that silently disagreed with each other and ignored yearly
// billing entirely).
//
// MRR is what recurs NOW, per paying user — not the sum of everything they
// have ever paid.
//
// This previously summed every paid Payment a premium user held. That was
// defensible under the old one-time model, where each purchase bought extra
// days that genuinely stacked. It is badly wrong under subscriptions: every
// renewal writes another paid Payment (see recordSubscriptionCharge), so a
// ₹399 Silver brand who had renewed six times counted as ₹2,394 of MRR. The
// number inflated with tenure, so the longer the platform ran the more
// fictional the revenue dashboard became.
//
// Order of authority per user:
//   1. their live Subscription's `amount` — the amount that will actually be
//      charged again, which is the definition of recurring revenue;
//   2. otherwise their MOST RECENT paid Payment — covers the one-time fallback
//      purchase and legacy one-time buyers, counting only the current period;
//   3. otherwise the tier's list price — legacy/manual grants with no payment.
async function computePremiumRevenue() {
  const now = new Date();

  const [premiumMembers, lifetimeAgg] = await Promise.all([
    User.find({ plan: 'premium', premiumUntil: { $gt: now } }).select('role tier premiumStartedAt premiumUntil'),
    // Total, all-time revenue actually collected — not tied to who's still active.
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);
  const lifetimeRevenue = Math.round((lifetimeAgg[0]?.total || 0) / 100);

  // Anyone who has ever been premium — needed for the 6-month trend below, and
  // fetched here so the payment/subscription maps cover historical members too.
  // Otherwise the trend priced lapsed members at list price while the headline
  // priced current ones from real payments, and the two disagreed.
  const everPremiumMembers = await User.find({
    premiumStartedAt: { $ne: null }
  }).select('role tier premiumStartedAt premiumUntil');

  const premiumUserIds = [...new Set(
    [...premiumMembers, ...everPremiumMembers].map(u => u._id.toString())
  )];
  const [paidPayments, liveSubs] = await Promise.all([
    // Newest first so the first row per user is their current period.
    // `source` is what tells a free-trial grant (see claimFreeTrial in
    // payment.controller.js) apart from an actual Razorpay payment below.
    Payment.find({ status: 'paid', userId: { $in: premiumUserIds } })
      .sort({ createdAt: -1 })
      .select('userId billingCycle amount createdAt source'),
    Subscription.find({
      userId: { $in: premiumUserIds },
      status: { $in: Subscription.LIVE_STATUSES },
    }).select('userId billingCycle amount'),
  ]);

  // Latest paid payment per user.
  const latestPaymentByUser = new Map();
  paidPayments.forEach(p => {
    const key = p.userId.toString();
    if (!latestPaymentByUser.has(key)) latestPaymentByUser.set(key, p);
  });
  const subByUser = new Map();
  liveSubs.forEach(s => {
    const key = s.userId.toString();
    if (!subByUser.has(key)) subByUser.set(key, s);
  });

  const toMonthly = (amountPaise, billingCycle) =>
    billingCycle === 'yearly' ? (amountPaise / 100) / 12 : amountPaise / 100;

  // The single recurring source of truth for this user — see the note above.
  const sourceFor = (u) =>
    subByUser.get(u._id.toString()) || latestPaymentByUser.get(u._id.toString()) || null;

  // True while the user's current premium period came from the one-time
  // free-trial grant rather than an actual charge (see claimFreeTrial). A
  // live subscription always wins this check — someone who trialed and then
  // separately subscribed is a real paying user, full stop. Kept out of
  // every "paying"/revenue count below (they generate ₹0), and reported
  // separately instead so admin can see them without either inflating
  // "Premium users" or silently vanishing from the dashboard.
  const isTrialFor = (u) => {
    const key = u._id.toString();
    if (subByUser.has(key)) return false;
    return latestPaymentByUser.get(key)?.source === 'free_trial';
  };

  const monthlyEquivalentFor = (u) => {
    const src = sourceFor(u);
    if (!src) return getTierConfig(u.role, u.tier)?.priceMonthly || 0;
    return toMonthly(src.amount, src.billingCycle);
  };

  // The cycle this user is actually billed on. A user sits in exactly one
  // bucket now — under subscriptions they cannot be on monthly and yearly at
  // the same time, since switching plans replaces the old subscription.
  const cyclesFor = (u) => {
    const src = sourceFor(u);
    return src ? new Set([src.billingCycle]) : new Set();
  };

  let influencerMRR = 0, brandMRR = 0;
  let influencerMonthlyCount = 0, influencerYearlyCount = 0;
  let brandMonthlyCount = 0, brandYearlyCount = 0;
  let premiumInfluencers = 0, premiumBrands = 0;
  let trialInfluencers = 0, trialBrands = 0;

  // Paying users and revenue split by tier, so admin can see whether the
  // money is coming from Silver volume or Golden/Platinum value.
  // `trialUsers` is tracked alongside but never folded into `users`/`mrr` —
  // those two stay strictly "paying", everywhere on this dashboard, so a
  // free trial can never read as revenue or as a paying subscriber count.
  const tierBreakdown = { influencer: {}, brand: {} };
  Object.keys(TIERS_BY_ROLE).forEach(role => {
    Object.keys(TIERS_BY_ROLE[role]).forEach(tier => {
      if (tier !== 'free') tierBreakdown[role][tier] = { users: 0, mrr: 0, trialUsers: 0 };
    });
  });

  premiumMembers.forEach(u => {
    const tierKey = u.tier && u.tier !== 'free' ? u.tier : null;

    if (isTrialFor(u)) {
      if (tierKey && tierBreakdown[u.role]?.[tierKey]) tierBreakdown[u.role][tierKey].trialUsers += 1;
      if (u.role === 'influencer') trialInfluencers++;
      else if (u.role === 'brand') trialBrands++;
      return; // free — excluded from every paying/revenue count below
    }

    const monthlyEquivalent = monthlyEquivalentFor(u);
    const cycles = cyclesFor(u);
    // No paid record at all (legacy/manual grant) — default to the monthly
    // bucket, same as the previous fallback behavior.
    const hasMonthly = cycles.has('monthly') || cycles.size === 0;
    const hasYearly = cycles.has('yearly');

    if (tierKey && tierBreakdown[u.role] && tierBreakdown[u.role][tierKey]) {
      tierBreakdown[u.role][tierKey].users += 1;
      tierBreakdown[u.role][tierKey].mrr += monthlyEquivalent;
    }

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

  Object.values(tierBreakdown).forEach(byTier =>
    Object.values(byTier).forEach(t => { t.mrr = Math.round(t.mrr); })
  );

  influencerMRR = Math.round(influencerMRR);
  brandMRR = Math.round(brandMRR);
  const mrr = influencerMRR + brandMRR;
  const arr = mrr * 12;

  // ── Cumulative active Premium revenue over the last 6 months ──
  // Same normalized-monthly-value logic, applied at each month-end for
  // whoever had already upgraded by then (based on premiumStartedAt).
  // Each month-end is evaluated on both ends: the member had started by then
  // AND had not yet lapsed. The old version filtered on `plan: 'premium'` only
  // and tested just the start date, so lapsed members were counted forever and
  // the line could only ever rise — a revenue trend that structurally could
  // not show churn.
  const mrrTrend = [];
  for (let i = 5; i >= 0; i--) {
    // Last millisecond of the month i months ago.
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    let monthMrr = 0;
    everPremiumMembers.forEach(u => {
      const started = new Date(u.premiumStartedAt) <= monthEnd;
      const stillActive = u.premiumUntil && new Date(u.premiumUntil) > monthEnd;
      if (started && stillActive) monthMrr += monthlyEquivalentFor(u);
    });
    mrrTrend.push({ month: MONTHS[(now.getMonth() - i + 12) % 12], value: Math.round(monthMrr) });
  }

  return {
    // Paying only, everywhere — see isTrialFor above.
    premiumInfluencers,
    premiumBrands,
    totalPremium: premiumInfluencers + premiumBrands,
    // Currently on the one-time free-trial grant (claimFreeTrial) — active,
    // but ₹0. Reported separately rather than folded into premium* above so
    // the revenue-facing numbers never quietly include free users.
    trialInfluencers,
    trialBrands,
    totalTrial: trialInfluencers + trialBrands,
    mrr,
    arr,
    lifetimeRevenue,
    influencerMRR,
    brandMRR,
    influencerMonthlyCount,
    influencerYearlyCount,
    brandMonthlyCount,
    brandYearlyCount,
    tierBreakdown,
    mrrTrend
  };
}

module.exports = { computePremiumRevenue };
