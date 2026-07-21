const User = require('../models/User');
const Payment = require('../models/Payment');
const notify = require('../services/email');
const applyPremiumUpgrade = require('../utils/applyPremiumUpgrade');
const { BILLING_CYCLES, getPlanAmountPaise } = require('../utils/planPricing');
const razorpay = require('../services/razorpay');

// ─────────────────────────────────────────
// CREATE ORDER
// ─────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { billingCycle } = req.body;
    const role = req.user.role;

    if (!BILLING_CYCLES[billingCycle]) {
      return res.status(400).json({ error: 'Invalid billing cycle.' });
    }
    const amountPaise = getPlanAmountPaise(role, billingCycle);
    if (!amountPaise) {
      return res.status(400).json({ error: 'No Premium plan available for this account type.' });
    }

    // Razorpay caps `receipt` at 40 chars — keep it short; the full userId
    // already travels in `notes` for lookups on the Razorpay dashboard.
    const receipt = `prem_${Date.now()}_${req.userId.toString().slice(-8)}`;
    const order = await razorpay.createOrder({
      amountPaise,
      receipt,
      notes: { userId: req.userId.toString(), role, billingCycle },
    });

    await Payment.create({
      userId: req.userId,
      role,
      billingCycle,
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
async function confirmPaymentAndUpgrade(payment, razorpayPaymentId, razorpaySignature) {
  if (payment.status === 'paid') return; // already applied

  payment.status = 'paid';
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature || '';
  try {
    await payment.save();
  } catch (err) {
    if (err.code === 11000) return; // lost the race to the other path — already applied
    throw err;
  }

  const user = await User.findById(payment.userId);
  if (!user) return;
  applyPremiumUpgrade(user, BILLING_CYCLES[payment.billingCycle].days);
  await user.save();

  notify.premiumUpgradeConfirmed(user.email, {
    role: user.role,
    billingCycle: payment.billingCycle,
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

    await confirmPaymentAndUpgrade(payment, razorpay_payment_id, razorpay_signature);

    const user = await User.findById(req.userId);
    res.json({
      message: 'Payment verified. Premium is now active.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
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
      if (payment) await confirmPaymentAndUpgrade(payment, entity.id, '');
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
          await confirmPaymentAndUpgrade(payment, captured.id, '');
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
