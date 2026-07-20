// Shared by the real Razorpay flow (payment.controller.js) and the
// non-production dev-bypass (auth.controller.js upgradePlan) so both extend
// premiumUntil the same way: from the existing expiry if still active
// (renewing early doesn't lose remaining paid time), otherwise from now.
function applyPremiumUpgrade(user, months) {
  const now = new Date();
  const base = user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
  const premiumUntil = new Date(base);
  premiumUntil.setMonth(premiumUntil.getMonth() + months);

  user.plan = 'premium';
  if (!user.premiumStartedAt) user.premiumStartedAt = now;
  user.premiumUntil = premiumUntil;
}

module.exports = applyPremiumUpgrade;
