// Single source of truth for tier pricing — read by admin MRR calculations
// (admin.controller.js) and by the Razorpay order-creation flow
// (payment.controller.js) so the two can never drift apart.
//
// Monthly prices in rupees, per role + tier — matches backend/utils/tiers.js
// (the feature-limits config) and the marketing/billing pages on the frontend.
const { getTierConfig, isValidTier } = require('./tiers');

// One-time, non-recurring purchases — a cycle just buys a fixed number of
// days of that tier's access (30 or 365), not an auto-renewing subscription
// (unless autopay is on — see the autopay scaffold in payment.controller.js).
// Yearly billing is 20% off (2 months free), rounded — mirrors the
// `yearly(monthly) = Math.round(monthly * 12 * 0.8)` formula used on the
// frontend pricing pages.
const BILLING_CYCLES = {
  monthly: { days: 30, price: (monthly) => monthly },
  yearly: { days: 365, price: (monthly) => Math.round(monthly * 12 * 0.8) },
};

// Amount to charge, in paise (Razorpay's smallest currency unit), for a
// role + tier + billing cycle combination. Returns null for the free tier
// (nothing to charge) or an invalid combination.
function getPlanAmountPaise(role, tier, billingCycle) {
  if (!isValidTier(role, tier) || tier === 'free') return null;
  const config = getTierConfig(role, tier);
  const cycle = BILLING_CYCLES[billingCycle];
  if (!config || !cycle) return null;
  return Math.round(cycle.price(config.priceMonthly) * 100);
}

module.exports = { BILLING_CYCLES, getPlanAmountPaise };
