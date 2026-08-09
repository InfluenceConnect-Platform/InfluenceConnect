const { syncPlanFromTier } = require('./tiers');

// Shared by the real Razorpay flow (payment.controller.js) and the
// non-production dev-bypass (auth.controller.js upgradePlan) so both extend
// premiumUntil the same way: from the existing expiry if still active
// (buying again early stacks on top of remaining paid time instead of
// wasting it), otherwise from now. A purchase is one-time by default — it
// simply expires on premiumUntil — unless the user has autopay enabled, in
// which case a scheduled renewal job re-charges before expiry (see the
// autopay scaffold in payment.controller.js).
function applyTierUpgrade(user, tier, days) {
  const now = new Date();
  const base = user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
  const premiumUntil = new Date(base);
  premiumUntil.setDate(premiumUntil.getDate() + days);

  user.tier = tier;
  syncPlanFromTier(user);
  if (!user.premiumStartedAt) user.premiumStartedAt = now;
  user.premiumUntil = premiumUntil;
}

module.exports = applyTierUpgrade;
