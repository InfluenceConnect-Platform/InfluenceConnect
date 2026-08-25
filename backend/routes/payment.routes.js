const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { accountActionLimiter, webhookLimiter } = require('../middleware/rateLimit.middleware');
const { createOrder, verifyPayment, claimFreeTrial, webhook, reconcile, setAutopay, autopayRenewals } = require('../controllers/payment.controller');
const {
  createSubscription,
  verifySubscription,
  getMySubscription,
  cancelSubscription,
  resumeSubscription,
} = require('../controllers/subscription.controller');

// POST /api/payments/create-order
router.post('/create-order', authenticate, accountActionLimiter, createOrder);

// POST /api/payments/verify
router.post('/verify', authenticate, accountActionLimiter, verifyPayment);

// POST /api/payments/claim-free-trial  — first-purchase-free perk, { tier }.
// Bypasses Razorpay entirely (see claimFreeTrial for why); rate-limited the
// same as the real checkout endpoints even though nothing is charged, since
// it still mutates account state.
router.post('/claim-free-trial', authenticate, accountActionLimiter, claimFreeTrial);

// POST /api/payments/webhook  (Razorpay server-to-server, unauthenticated —
// verified via X-Razorpay-Signature inside the controller instead)
router.post('/webhook', webhookLimiter, webhook);

// GET /api/payments/reconcile  (Vercel Cron only, gated by CRON_SECRET —
// see vercel.json. Sweeps orders stuck in 'created' in case a webhook was
// lost and the user never returned to trigger /verify.)
router.get('/reconcile', reconcile);

// POST /api/payments/autopay  (toggle Autopay on/off for the current user)
router.post('/autopay', authenticate, accountActionLimiter, setAutopay);

// GET /api/payments/autopay-renewals  (Vercel Cron only, gated by CRON_SECRET
// — see vercel.json. Razorpay raises recurring charges itself; this only
// re-syncs subscriptions whose webhook was lost.)
router.get('/autopay-renewals', autopayRenewals);

// ── Recurring billing (Razorpay Subscriptions) ──────────────────────────
// POST /api/payments/subscription           start an auto-renewing plan
router.post('/subscription', authenticate, accountActionLimiter, createSubscription);

// POST /api/payments/subscription/verify    checkout success handler
router.post('/subscription/verify', authenticate, accountActionLimiter, verifySubscription);

// GET  /api/payments/subscription           current subscription for billing UI
router.get('/subscription', authenticate, getMySubscription);

// POST /api/payments/subscription/cancel    { immediate?, reason? }
router.post('/subscription/cancel', authenticate, accountActionLimiter, cancelSubscription);

// POST /api/payments/subscription/resume    guidance for re-enabling auto-renewal
router.post('/subscription/resume', authenticate, accountActionLimiter, resumeSubscription);

module.exports = router;
