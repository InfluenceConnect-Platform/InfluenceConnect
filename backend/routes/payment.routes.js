const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { accountActionLimiter, webhookLimiter } = require('../middleware/rateLimit.middleware');
const { createOrder, verifyPayment, webhook, reconcile } = require('../controllers/payment.controller');

// POST /api/payments/create-order
router.post('/create-order', authenticate, accountActionLimiter, createOrder);

// POST /api/payments/verify
router.post('/verify', authenticate, accountActionLimiter, verifyPayment);

// POST /api/payments/webhook  (Razorpay server-to-server, unauthenticated —
// verified via X-Razorpay-Signature inside the controller instead)
router.post('/webhook', webhookLimiter, webhook);

// GET /api/payments/reconcile  (Vercel Cron only, gated by CRON_SECRET —
// see vercel.json. Sweeps orders stuck in 'created' in case a webhook was
// lost and the user never returned to trigger /verify.)
router.get('/reconcile', reconcile);

module.exports = router;
