const crypto = require('crypto');
const Razorpay = require('razorpay');

// Test vs. live mode is inferred entirely from the key prefix
// (rzp_test_... vs rzp_live_...) by Razorpay itself — nothing here branches
// on environment, so going live later is purely an env var swap.
function getInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

async function createOrder({ amountPaise, receipt, notes }) {
  const instance = getInstance();
  return instance.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes,
  });
}

// Constant-time compare so a signature mismatch can't be timed byte-by-byte.
function safeEqual(expectedHex, actualHex) {
  if (typeof actualHex !== 'string') return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Checkout success-handler signature: HMAC-SHA256("order_id|payment_id", key_secret).
// Per Razorpay docs — never trust the client-side success callback alone.
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

// Webhook signature: HMAC-SHA256(rawRequestBody, webhook_secret).
function verifyWebhookSignature({ rawBody, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return safeEqual(expected, signature);
}

module.exports = { createOrder, verifyPaymentSignature, verifyWebhookSignature };
