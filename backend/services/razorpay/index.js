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

// Used by the reconciliation sweep to check the real status of an order
// directly with Razorpay when our own webhook/verify flow never landed.
async function fetchOrderPayments(orderId) {
  const instance = getInstance();
  const { items } = await instance.orders.fetchPayments(orderId);
  return items;
}

// ─────────────────────────────────────────────────────────────
// RECURRING BILLING (Razorpay Subscriptions)
//
// A one-time Order's payment method cannot be re-charged server-side later,
// so auto-renewal runs on Subscriptions instead: a Plan defines the amount +
// interval, a Subscription binds a customer's mandate to that Plan, and
// Razorpay raises each subsequent charge itself and tells us over webhooks.
//
// REQUIRES the Razorpay account to have Recurring Payments / Subscriptions
// enabled — that is dashboard configuration, not code. Until it is enabled
// these calls fail and createSubscription surfaces a clear error.
// ─────────────────────────────────────────────────────────────

// Plans are immutable on Razorpay's side, so one is created per
// role+tier+cycle and then reused forever (see RazorpayPlan model).
async function createPlan({ period, interval, amountPaise, name, notes }) {
  const instance = getInstance();
  return instance.plans.create({
    period,          // 'monthly' | 'yearly'
    interval,        // billing every N periods — always 1 here
    item: { name, amount: amountPaise, currency: 'INR' },
    notes,
  });
}

// total_count is how many cycles Razorpay will attempt before completing the
// subscription. There's no "forever" value, so we book a long horizon
// (10 years) and let cancellation end it earlier.
async function createSubscription({ planId, totalCount, notes, notifyEmail, notifyPhone }) {
  const instance = getInstance();
  return instance.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    quantity: 1,
    // Razorpay sends its own mandate/pre-debit notifications to the customer,
    // which is what the RBI e-mandate framework requires ahead of each debit.
    customer_notify: 1,
    notes,
    ...(notifyEmail || notifyPhone
      ? { notify_info: { notify_email: notifyEmail, notify_phone: notifyPhone } }
      : {}),
  });
}

async function fetchSubscription(subscriptionId) {
  const instance = getInstance();
  return instance.subscriptions.fetch(subscriptionId);
}

// cancelAtCycleEnd=true keeps access until the paid period ends (the default
// we offer); false terminates immediately.
async function cancelSubscription(subscriptionId, cancelAtCycleEnd = true) {
  const instance = getInstance();
  return instance.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

// Checkout success handler for Subscriptions signs
// HMAC-SHA256("payment_id|subscription_id") — note this is the REVERSE of the
// Orders flow above, which signs "order_id|payment_id". Getting the operand
// order wrong silently rejects every valid subscription payment.
function verifySubscriptionSignature({ paymentId, subscriptionId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchOrderPayments,
  createPlan,
  createSubscription,
  fetchSubscription,
  cancelSubscription,
  verifySubscriptionSignature,
};
