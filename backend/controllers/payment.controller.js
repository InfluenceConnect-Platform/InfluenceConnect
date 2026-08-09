const User = require('../models/User');
const Payment = require('../models/Payment');
const notify = require('../services/email');
const applyTierUpgrade = require('../utils/applyPremiumUpgrade');
const { BILLING_CYCLES, getPlanAmountPaise } = require('../utils/planPricing');
const { isValidTier } = require('../utils/tiers');
const razorpay = require('../services/razorpay');

// ─────────────────────────────────────────
// CREATE ORDER
// ─────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { billingCycle, tier } = req.body;
    const role = req.user.role;

    if (!BILLING_CYCLES[billingCycle]) {
      return res.status(400).json({ error: 'Invalid billing cycle.' });
    }
    if (!tier || !isValidTier(role, tier) || tier === 'free') {
      return res.status(400).json({ error: 'Invalid plan tier.' });
    }
    const amountPaise = getPlanAmountPaise(role, tier, billingCycle);
    if (!amountPaise) {
      return res.status(400).json({ error: 'No plan available for this account type.' });
    }

    // Razorpay caps `receipt` at 40 chars — keep it short; the full userId
    // already travels in `notes` for lookups on the Razorpay dashboard.
    const receipt = `prem_${Date.now()}_${req.userId.toString().slice(-8)}`;
    const order = await razorpay.createOrder({
      amountPaise,
      receipt,
      notes: { userId: req.userId.toString(), role, billingCycle, tier },
    });

    await Payment.create({
      userId: req.userId,
      role,
      billingCycle,
      tier,
      amount: amountPaise,
      currency: 'INR',
      razorpayOrderId: order.id,
      status: 'created',
    });

    res.json({
      orderId: order.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
};

// Applies the upgrade exactly once per Payment doc — called from both the
// client-side /verify call and the /webhook, whichever arrives first.
async function confirmPaymentAndUpgrade(payment, razorpayPaymentId, razorpaySignature, method) {
  if (payment.status === 'paid') return; // already applied

  payment.status = 'paid';
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature || '';
  if (method) payment.method = method;
  try {
    await payment.save();
  } catch (err) {
    if (err.code === 11000) return; // lost the race to the other path — already applied
    throw err;
  }

  const user = await User.findById(payment.userId);
  if (!user) return;
  applyTierUpgrade(user, payment.tier, BILLING_CYCLES[payment.billingCycle].days);
  await user.save();

  notify.premiumUpgradeConfirmed(user.email, {
    role: user.role,
    billingCycle: payment.billingCycle,
    tier: payment.tier,
    amount: payment.amount / 100,
    premiumUntil: user.premiumUntil,
  });
}

// ─────────────────────────────────────────
// VERIFY PAYMENT  (client-side checkout success handler)
// ─────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields.' });
    }

    const valid = razorpay.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return res.status(400).json({ error: 'Payment verification failed.' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, userId: req.userId });
    if (!payment) return res.status(404).json({ error: 'Order not found.' });

    // Best-effort: look up the payment method from Razorpay for the admin
    // dashboard. Never block confirmation if this lookup fails.
    let method = '';
    try {
      const orderPayments = await razorpay.fetchOrderPayments(razorpay_order_id);
      method = orderPayments.find((p) => p.id === razorpay_payment_id)?.method || '';
    } catch (err) {
      console.error('Fetch payment method error:', err);
    }

    await confirmPaymentAndUpgrade(payment, razorpay_payment_id, razorpay_signature, method);

    const user = await User.findById(req.userId);
    res.json({
      message: 'Payment verified. Premium is now active.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        tier: user.tier,
        premiumStartedAt: user.premiumStartedAt,
        premiumUntil: user.premiumUntil,
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Something went wrong verifying your payment.' });
  }
};

// ─────────────────────────────────────────
// WEBHOOK  (server-to-server backstop — payment.captured / payment.failed)
// ─────────────────────────────────────────
exports.webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const valid = razorpay.verifyWebhookSignature({ rawBody: req.rawBody, signature });
    if (!valid) return res.status(400).json({ error: 'Invalid webhook signature.' });

    const { event, payload } = req.body;

    if (event === 'payment.captured') {
      const entity = payload?.payment?.entity;
      const payment = await Payment.findOne({ razorpayOrderId: entity?.order_id });
      if (payment) await confirmPaymentAndUpgrade(payment, entity.id, '', entity.method);
    } else if (event === 'payment.failed') {
      const entity = payload?.payment?.entity;
      await Payment.updateOne(
        { razorpayOrderId: entity?.order_id, status: 'created' },
        { status: 'failed' }
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
};

// ─────────────────────────────────────────
// RECONCILE  (Vercel Cron backstop — catches orders stuck in 'created'
// because the webhook was never delivered/exhausted retries AND the user
// never returned to the success page for /verify to run)
// ─────────────────────────────────────────
const STUCK_AFTER_MS = 30 * 60 * 1000; // Razorpay checkout sessions expire well before this

exports.reconcile = async (req, res) => {
  // Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` when
  // a CRON_SECRET env var is set on the project — no extra config needed.
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const stuck = await Payment.find({
      status: 'created',
      createdAt: { $lt: new Date(Date.now() - STUCK_AFTER_MS) },
    }).limit(100);

    let confirmed = 0;
    let failed = 0;
    let errored = 0;

    for (const payment of stuck) {
      try {
        const razorpayPayments = await razorpay.fetchOrderPayments(payment.razorpayOrderId);
        const captured = razorpayPayments.find((p) => p.status === 'captured');

        if (captured) {
          await confirmPaymentAndUpgrade(payment, captured.id, '', captured.method);
          confirmed++;
        } else if (razorpayPayments.length > 0 && razorpayPayments.every((p) => p.status === 'failed')) {
          await Payment.updateOne({ _id: payment._id, status: 'created' }, { status: 'failed' });
          failed++;
        }
        // else: no payment attempt yet on Razorpay's side — leave as 'created',
        // the user likely abandoned checkout before paying.
      } catch (err) {
        console.error(`Reconcile error for order ${payment.razorpayOrderId}:`, err);
        errored++;
      }
    }

    res.json({ checked: stuck.length, confirmed, failed, errored });
  } catch (error) {
    console.error('Reconcile sweep error:', error);
    res.status(500).json({ error: 'Reconciliation sweep failed.' });
  }
};

// ─────────────────────────────────────────
// AUTOPAY TOGGLE
// ─────────────────────────────────────────
exports.setAutopay = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be true or false.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Autopay only makes sense once there's a paid tier to renew.
    if (enabled && (!user.tier || user.tier === 'free')) {
      return res.status(400).json({ error: 'Upgrade to a paid plan before enabling Autopay.' });
    }

    user.autopay = enabled;
    await user.save();

    res.json({ message: enabled ? 'Autopay enabled.' : 'Autopay disabled.', autopay: user.autopay });
  } catch (error) {
    console.error('Set autopay error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// AUTOPAY RENEWALS  (Vercel Cron scaffold — see vercel.json)
//
// SCAFFOLD ONLY: this identifies who is due for renewal but does not charge
// anyone yet. Razorpay isn't configured for recurring billing on this
// project — the createOrder/verifyPayment flow above only creates one-time
// Orders, which can't be charged again server-side without the customer
// present at checkout. Wiring a real charge here requires:
//   1. Razorpay Subscriptions or an e-mandate ("Recurring Payments") set up
//      on the merchant account (dashboard config, not code).
//   2. Capturing a mandate/customer token at the ORIGINAL checkout — in
//      createOrder, when billingCycle + tier + autopay:true is requested —
//      since a one-time Order's payment method can't be reused later.
//   3. Replacing the TODO below with an actual server-initiated charge
//      against that stored token, then calling applyTierUpgrade + emailing
//      a receipt exactly like confirmPaymentAndUpgrade does today.
// Until then, this job only reports who *would* be renewed, so the rest of
// the autopay plumbing (the toggle, the User.autopay field, this cron slot)
// is proven out end-to-end before real money moves through it.
// ─────────────────────────────────────────
const RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000; // flag renewals due within 24h

exports.autopayRenewals = async (req, res) => {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` — same gate as /reconcile.
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const dueUsers = await User.find({
      autopay: true,
      tier: { $ne: 'free' },
      premiumUntil: { $lte: new Date(Date.now() + RENEWAL_WINDOW_MS), $gt: new Date() },
    }).select('_id name email role tier premiumUntil');

    // TODO(autopay): once Razorpay recurring is configured, replace this
    // with real charges — see the scaffold comment above.
    if (dueUsers.length) {
      console.log(`[autopay] ${dueUsers.length} user(s) due for renewal:`, dueUsers.map(u => u._id.toString()));
    }

    res.json({
      scaffold: true,
      message: 'Autopay renewal charging is not yet wired to Razorpay recurring billing — see code comment in payment.controller.js.',
      dueForRenewal: dueUsers.length,
    });
  } catch (error) {
    console.error('Autopay renewals sweep error:', error);
    res.status(500).json({ error: 'Autopay renewal sweep failed.' });
  }
};
