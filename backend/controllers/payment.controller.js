const User = require('../models/User');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
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
    const desc = error?.error?.description || error?.description || error?.message || '';
    console.error('Create order error:', desc, error);
    // This is the last payment path there is — if it fails there's nothing to
    // fall back to, so say which kind of failure it was rather than sending
    // everyone to "try again" for a problem retrying cannot fix.
    if (error?.code === 'PAYMENTS_NOT_CONFIGURED') {
      return res.status(503).json({
        error: 'Payments are not set up on this environment yet. Please contact support.',
        code: 'PAYMENTS_NOT_CONFIGURED',
      });
    }
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
// Subscription webhook events. Razorpay drives the recurring schedule, so
// these are the primary source of truth for renewals — not a backstop.
//
//   subscription.charged   — a cycle was paid; extend access + send receipt
//   subscription.activated — mandate authorised and running
//   subscription.pending   — a debit failed; Razorpay will retry
//   subscription.halted    — retries exhausted; needs the user to act
//   subscription.cancelled — ended (by us, or by the user at their bank)
//   subscription.completed — ran out its booked cycles
// ─────────────────────────────────────────
async function handleSubscriptionEvent(event, payload) {
  const entity = payload?.subscription?.entity;
  const subId = entity?.id;
  if (!subId) return;

  const sub = await Subscription.findOne({ razorpaySubscriptionId: subId });
  if (!sub) return;

  const subCtrl = require('./subscription.controller');

  if (event === 'subscription.charged') {
    const paymentEntity = payload?.payment?.entity;
    await subCtrl.applyChargedCycle(sub, {
      remote: entity,
      razorpayPaymentId: paymentEntity?.id,
      method: paymentEntity?.method,
    });
    return;
  }

  if (event === 'subscription.halted' || event === 'subscription.pending') {
    sub.lastFailedAt = new Date();
    await subCtrl.syncSubscriptionFromRemote(sub, entity, { skipSave: true });
    sub.status = event === 'subscription.halted' ? 'halted' : 'pending';
    await sub.save();
    await subCtrl.syncAutopayFlag(sub.userId);

    const user = await User.findById(sub.userId);
    if (user) {
      notify.subscriptionPaymentFailed(user.email, {
        role: user.role,
        tier: sub.tier,
        halted: event === 'subscription.halted',
        // Access runs to the end of the period they already paid for.
        accessUntil: user.premiumUntil,
      });
    }
    return;
  }

  if (event === 'subscription.cancelled' || event === 'subscription.completed'
      || event === 'subscription.expired') {
    await subCtrl.syncSubscriptionFromRemote(sub, entity, { skipSave: true });
    sub.status = event.split('.')[1];
    if (!sub.endedAt) sub.endedAt = new Date();
    await sub.save();
    await subCtrl.syncAutopayFlag(sub.userId);
    return;
  }

  // activated / authenticated / updated — just mirror the new state.
  await subCtrl.syncSubscriptionFromRemote(sub, entity);
  await subCtrl.syncAutopayFlag(sub.userId);
}

// ─────────────────────────────────────────
// WEBHOOK  (server-to-server — payment.* backstop and subscription.* primary)
// ─────────────────────────────────────────
exports.webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const valid = razorpay.verifyWebhookSignature({ rawBody: req.rawBody, signature });
    if (!valid) return res.status(400).json({ error: 'Invalid webhook signature.' });

    const { event, payload } = req.body;

    if (event === 'payment.captured') {
      const entity = payload?.payment?.entity;
      // Subscription charges also emit payment.captured, but they carry no
      // order_id of ours — they're handled by subscription.charged below.
      if (entity?.order_id) {
        const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
        if (payment) await confirmPaymentAndUpgrade(payment, entity.id, '', entity.method);
      }
    } else if (event === 'payment.failed') {
      const entity = payload?.payment?.entity;
      if (entity?.order_id) {
        await Payment.updateOne(
          { razorpayOrderId: entity.order_id, status: 'created' },
          { status: 'failed' }
        );
      }
    } else if (event && event.startsWith('subscription.')) {
      await handleSubscriptionEvent(event, payload);
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
// AUTOPAY TOGGLE  (legacy shim)
//
// Autopay is no longer a standalone flag — it is a consequence of holding a
// Razorpay Subscription. Turning it OFF therefore means cancelling that
// subscription at the end of the current cycle; turning it ON requires a
// fresh mandate, which can only be authorised at checkout. This endpoint is
// kept so older clients get a coherent answer instead of silently writing a
// flag that nothing honours.
// ─────────────────────────────────────────
exports.setAutopay = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be true or false.' });
    }

    if (enabled) {
      return res.status(409).json({
        error: 'Auto-renewal has to be authorised at checkout. Choose an auto-renewing plan on the billing page.',
        code: 'REQUIRES_CHECKOUT',
      });
    }

    // enabled:false — delegate to the real cancellation path.
    const { cancelForUser } = require('./subscription.controller');
    const result = await cancelForUser(req.userId, {
      immediate: false,
      reason: 'Turned off from settings',
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Set autopay error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SUBSCRIPTION RECONCILE  (Vercel Cron — see vercel.json)
//
// Razorpay raises recurring charges itself and reports them over
// subscription.* webhooks, so this job does NOT charge anyone. It exists to
// catch subscriptions whose webhook was lost: anything whose local period has
// run out, or that we still think is mid-authorisation, is re-fetched from
// Razorpay and re-synced. Safe to run repeatedly — applyChargedCycle is
// idempotent on the Razorpay payment id.
// ─────────────────────────────────────────
const SUB_STALE_MS = 6 * 60 * 60 * 1000; // re-check anything unsynced for 6h

exports.autopayRenewals = async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const subCtrl = require('./subscription.controller');
    const now = new Date();

    const stale = await Subscription.find({
      status: { $in: ['created', 'authenticated', 'active', 'pending'] },
      $or: [
        { currentEnd: { $lte: now } },       // period lapsed but no renewal seen
        { chargeAt: { $lte: now } },         // charge was due and never reported
        { updatedAt: { $lte: new Date(Date.now() - SUB_STALE_MS) } },
      ],
    }).limit(100);

    let synced = 0;
    let errored = 0;

    for (const sub of stale) {
      try {
        const remote = await razorpay.fetchSubscription(sub.razorpaySubscriptionId);
        await subCtrl.syncSubscriptionFromRemote(sub, remote);
        await subCtrl.syncAutopayFlag(sub.userId);
        synced += 1;
      } catch (err) {
        console.error(`[subscription-reconcile] ${sub.razorpaySubscriptionId}`, err.message);
        errored += 1;
      }
    }

    res.json({ checked: stale.length, synced, errored });
  } catch (error) {
    console.error('Subscription reconcile sweep error:', error);
    res.status(500).json({ error: 'Subscription reconcile sweep failed.' });
  }
};
