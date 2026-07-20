// Single source of truth for Premium pricing — read by admin MRR calculations
// (admin.controller.js) and by the Razorpay order-creation flow
// (payment.controller.js) so the two can never drift apart.
//
// Monthly prices in rupees; matches the numbers shown on the marketing
// pricing page (frontend/components/marketing/PricingSection.tsx) and the
// in-app billing pages (frontend/app/{brand,influencer}/billing/page.tsx).
const PLAN_PRICE = { influencer: 299, brand: 1499 };

// Yearly billing is 20% off (2 months free), rounded — mirrors the
// `yearly(monthly) = Math.round(monthly * 12 * 0.8)` formula used on the
// frontend pricing pages.
const BILLING_CYCLES = {
  monthly: { months: 1, price: (monthly) => monthly },
  yearly: { months: 12, price: (monthly) => Math.round(monthly * 12 * 0.8) },
};

// Amount to charge, in paise (Razorpay's smallest currency unit), for a
// role + billing cycle combination.
function getPlanAmountPaise(role, billingCycle) {
  const monthly = PLAN_PRICE[role];
  const cycle = BILLING_CYCLES[billingCycle];
  if (!monthly || !cycle) return null;
  return Math.round(cycle.price(monthly) * 100);
}

module.exports = { PLAN_PRICE, BILLING_CYCLES, getPlanAmountPaise };
