// Shared by the real Razorpay flow (payment.controller.js) and the
// non-production dev-bypass (auth.controller.js upgradePlan) so both extend
// premiumUntil the same way: from the existing expiry if still active
// (buying again early stacks on top of remaining paid time instead of
// wasting it), otherwise from now. Premium is a one-time purchase, not an
// auto-renewing subscription — it simply expires on premiumUntil.
function applyPremiumUpgrade(user, days) {
  const now = new Date();
  const base = user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
  const premiumUntil = new Date(base);
  premiumUntil.setDate(premiumUntil.getDate() + days);

  user.plan = 'premium';
  if (!user.premiumStartedAt) user.premiumStartedAt = now;
  user.premiumUntil = premiumUntil;
}

module.exports = applyPremiumUpgrade;
