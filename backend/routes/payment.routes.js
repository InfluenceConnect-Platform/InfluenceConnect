const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { accountActionLimiter } = require('../middleware/rateLimit.middleware');
const { createOrder, verifyPayment, webhook } = require('../controllers/payment.controller');

// POST /api/payments/create-order
router.post('/create-order', authenticate, accountActionLimiter, createOrder);

// POST /api/payments/verify
router.post('/verify', authenticate, accountActionLimiter, verifyPayment);

// POST /api/payments/webhook  (Razorpay server-to-server, unauthenticated —
// verified via X-Razorpay-Signature inside the controller instead)
router.post('/webhook', webhook);

module.exports = router;
