const User = require('../models/User');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const RazorpayPlan = require('../models/RazorpayPlan');
const notify = require('../services/email');
const applyTierUpgrade = require('../utils/applyPremiumUpgrade');
const { BILLING_CYCLES, getPlanAmountPaise } = require('../utils/planPricing');
const { isValidTier, getTierConfig, syncPlanFromTier } = require('../utils/tiers');
const razorpay = require('../services/razorpay');

// Razorpay has no "charge forever" option, so subscriptions are booked for a
// long horizon and ended by cancellation instead. 10 years of cycles.
const TOTAL_COUNT = { monthly: 120, yearly: 10 };

// Razorpay Plan period names happen to match our billing cycle names.
const PLAN_PERIOD = { monthly: 'monthly', yearly: 'yearly' };

// ─────────────────────────────────────────
// Find-or-create the Razorpay Plan for a role+tier+cycle.
// ─────────────────────────────────────────
async function getOrCreatePlan({ role, tier, billingCycle, amountPaise }) {
  const key = { role, tier, billingCycle, amountPaise };
  const cached = await RazorpayPlan.findOne(key);
  if (cached) return cached.razorpayPlanId;

  const tierConfig = getTierConfig(role, tier);
  const label = `${tierConfig?.label || tier} · ${role === 'brand' ? 'Brand' : 'Creator'} · ${billingCycle}`;

  const plan = await razorpay.createPlan({
    period: PLAN_PERIOD[billingCycle],
    interval: 1,
    amountPaise,
    name: `Influence Connect — ${label}`,
    notes: { role, tier, billingCycle },
  });

  try {
    await RazorpayPlan.create({ ...key, razorpayPlanId: plan.id });
  } catch (err) {
    // Lost a race with a concurrent checkout — reuse whichever plan landed
    // first so we don't strand this request.
    if (err.code === 11000) {
      const winner = await RazorpayPlan.findOne(key);
      if (winner) return winner.razorpayPlanId;
    }
    throw err;
  }
  return plan.id;
}

// Keeps User.autopay as a cheap mirror of "a subscription will renew", so
// existing UI that reads user.autopay stays correct without extra queries.
async function syncAutopayFlag(userId) {
  const live = await Subscription.findOne({
    userId,
    status: { $in: Subscription.LIVE_STATUSES },
  });
  const willRenew = !!live && live.willRenew();
  await User.updateOne({ _id: userId }, { autopay: willRenew });
  return live;
}

// ─────────────────────────────────────────
// CREATE SUBSCRIPTION  (auto-renewing checkout)
// ─────────────────────────────────────────
exports.createSubscription = async (req, res) => {
  // Hoisted so the catch below can tell "this user has a plan running" from
  // "this is a fresh purchase" — only the latter may fall back to a one-time
  // order, since charging a one-off on top of a live subscription would
  // double-bill them.
  let existing = null;
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

    // A user has at most one live subscription. Rather than dead-ending an
    // upgrade with "cancel first", switching plans schedules the new one to
    // begin exactly when the current paid period ends and winds the old one
    // down at the same moment — no double charge, no forfeited days.
    existing = await Subscription.findOne({
      userId: req.userId,
      status: { $in: Subscription.LIVE_STATUSES },
    });

    if (existing && existing.tier === tier && existing.billingCycle === billingCycle && !existing.cancelAtCycleEnd) {
      return res.status(409).json({
        error: 'You are already on this plan.',
        code: 'ALREADY_ON_PLAN',
      });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const planId = await getOrCreatePlan({ role, tier, billingCycle, amountPaise });

    // Defer the switch to the end of the period they've already paid for.
    const switchAt = existing?.currentEnd && existing.currentEnd > new Date()
      ? Math.floor(existing.currentEnd.getTime() / 1000)
      : null;

    const subscription = await razorpay.createSubscription({
      planId,
      totalCount: TOTAL_COUNT[billingCycle],
      notes: { userId: req.userId.toString(), role, tier, billingCycle },
      notifyEmail: user.email,
      notifyPhone: user.mobile || undefined,
      startAt: switchAt || undefined,
    });

    // Stop the outgoing plan renewing. Done only after Razorpay accepted the
    // replacement, so a failure here never leaves the user with neither.
    // If it fails we roll the replacement back rather than leave an orphan
    // subscription on Razorpay and two renewing plans on the account.
    if (existing) {
      try {
        await razorpay.cancelSubscription(existing.razorpaySubscriptionId, true);
        existing.cancelAtCycleEnd = true;
        existing.cancelledAt = new Date();
        existing.cancellationReason = `Switched to ${tier} (${billingCycle})`;
        await existing.save();
      } catch (err) {
        console.error('Could not wind down previous subscription:', err);
        try {
          await razorpay.cancelSubscription(subscription.id, false);
        } catch (rollbackErr) {
          console.error('Rollback of replacement subscription failed:', rollbackErr);
        }
        return res.status(502).json({
          error: 'Could not switch your plan. Nothing was charged — please try again.',
          code: 'SWITCH_FAILED',
        });
      }
    }

    await Subscription.create({
      userId: req.userId,
      role,
      tier,
      billingCycle,
      amount: amountPaise,
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: planId,
      status: subscription.status || 'created',
      totalCount: TOTAL_COUNT[billingCycle],
      currentStart: switchAt ? new Date(switchAt * 1000) : null,
    });

    res.json({
      subscriptionId: subscription.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      // Tells the UI whether this starts now or replaces a running plan later.
      startsAt: switchAt ? new Date(switchAt * 1000) : null,
      replacingPlan: existing ? existing.tier : null,
    });
  } catch (error) {
    // Log Razorpay's own words — the generic Error message alone never says
    // whether this was auth, config, or a bad plan.
    const desc = error?.error?.description || error?.description || error?.message || '';
    console.error('Create subscription error:', desc, error);

    // Setting up a subscription is entirely upstream work: create/reuse a Plan,
    // then create the Subscription. Every way that can fail — Recurring not
    // enabled on the account, bad or missing API keys, Razorpay down — is a
    // reason to let the buyer pay the one-time way instead of dead-ending them.
    //
    // This used to be gated on the error description matching a list of words,
    // which meant any wording Razorpay didn't phrase as expected fell through
    // to a generic 500 and blocked the purchase outright. The client cannot
    // act on that, so the default is now the recoverable answer.
    if (!existing) {
      return res.status(503).json({
        error: 'Auto-renewing plans are not available right now. You can still buy a one-time plan.',
        code: 'RECURRING_UNAVAILABLE',
      });
    }

    // With a plan already running, a one-time order on top would double-charge,
    // so this one genuinely has to stop here.
    res.status(500).json({ error: 'Could not change your plan right now. Nothing was charged — please try again.' });
  }
};

// ─────────────────────────────────────────
// VERIFY SUBSCRIPTION  (client-side checkout success handler)
// ─────────────────────────────────────────
exports.verifySubscription = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing subscription verification fields.' });
    }

    const valid = razorpay.verifySubscriptionSignature({
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return res.status(400).json({ error: 'Subscription verification failed.' });
    }

    const sub = await Subscription.findOne({
      razorpaySubscriptionId: razorpay_subscription_id,
      userId: req.userId,
    });
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // The authoritative period comes from Razorpay, and subscription.charged
    // may already have landed over webhook — applyChargedCycle is idempotent.
    let remote = null;
    try {
      remote = await razorpay.fetchSubscription(razorpay_subscription_id);
    } catch (err) {
      console.error('Fetch subscription error:', err);
    }

    await applyChargedCycle(sub, { remote, razorpayPaymentId: razorpay_payment_id });

    const user = await User.findById(req.userId);
    res.json({
      message: 'Subscription active. Your plan will renew automatically.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        tier: user.tier,
        autopay: user.autopay,
        premiumStartedAt: user.premiumStartedAt,
        premiumUntil: user.premiumUntil,
      },
    });
  } catch (error) {
    console.error('Verify subscription error:', error);
    res.status(500).json({ error: 'Something went wrong verifying your subscription.' });
  }
};

// ─────────────────────────────────────────
// Applies one successfully-charged cycle: extends premium access, records a
// Payment row for the receipt/history, and mirrors Razorpay's period fields.
//
// Idempotent on razorpayPaymentId — /verify and the subscription.charged
// webhook race each other, and only the first may extend the period.
// ─────────────────────────────────────────
async function applyChargedCycle(sub, { remote, razorpayPaymentId, method }) {
  if (razorpayPaymentId) {
    const already = await Payment.findOne({ razorpayPaymentId });
    if (already) {
      await syncSubscriptionFromRemote(sub, remote);
      return false;
    }
  }

  // Reserve the payment id first — the unique index makes this the lock that
  // decides which racer applies the upgrade.
  let payment;
  try {
    payment = await Payment.create({
      userId: sub.userId,
      role: sub.role,
      billingCycle: sub.billingCycle,
      tier: sub.tier,
      amount: sub.amount,
      currency: sub.currency,
      // Subscription charges have no Order of our making; key the row on the
      // subscription + cycle so the required-and-unique field stays unique.
      razorpayOrderId: `sub_${sub.razorpaySubscriptionId}_${sub.paidCount + 1}`,
      razorpayPaymentId: razorpayPaymentId || undefined,
      method: method || '',
      status: 'paid',
    });
  } catch (err) {
    if (err.code === 11000) {
      await syncSubscriptionFromRemote(sub, remote);
      return false; // another path already applied this cycle
    }
    throw err;
  }

  const user = await User.findById(sub.userId);
  if (user) {
    applyTierUpgrade(user, sub.tier, BILLING_CYCLES[sub.billingCycle].days);
    await user.save();

    notify.subscriptionCharged(user.email, {
      role: user.role,
      billingCycle: sub.billingCycle,
      tier: sub.tier,
      amount: sub.amount / 100,
      premiumUntil: user.premiumUntil,
      nextChargeAt: remote?.charge_at ? new Date(remote.charge_at * 1000) : null,
      isFirstCharge: sub.paidCount === 0,
    });
  }

  sub.paidCount += 1;
  sub.lastFailedAt = null;
  await syncSubscriptionFromRemote(sub, remote, { skipSave: true });
  await sub.save();
  await syncAutopayFlag(sub.userId);
  return true;
}

// Mirrors Razorpay's authoritative period/status fields onto our row.
async function syncSubscriptionFromRemote(sub, remote, { skipSave = false } = {}) {
  if (!remote) {
    if (!skipSave) await sub.save();
    return;
  }
  if (remote.status) sub.status = remote.status;
  if (remote.current_start) sub.currentStart = new Date(remote.current_start * 1000);
  if (remote.current_end) sub.currentEnd = new Date(remote.current_end * 1000);
  if (remote.charge_at) sub.chargeAt = new Date(remote.charge_at * 1000);
  if (typeof remote.paid_count === 'number') sub.paidCount = remote.paid_count;
  if (remote.ended_at) sub.endedAt = new Date(remote.ended_at * 1000);
  if (!skipSave) await sub.save();
}

exports.applyChargedCycle = applyChargedCycle;
exports.syncSubscriptionFromRemote = syncSubscriptionFromRemote;
exports.syncAutopayFlag = syncAutopayFlag;

// ─────────────────────────────────────────
// GET MY SUBSCRIPTION  (drives the billing page)
// ─────────────────────────────────────────
exports.getMySubscription = async (req, res) => {
  try {
    const live = await Subscription.find({
      userId: req.userId,
      status: { $in: Subscription.LIVE_STATUSES },
    }).sort({ createdAt: -1 });

    if (!live.length) return res.json({ subscription: null });

    // When a switch is scheduled there are two live rows: the plan currently
    // being paid for, and its replacement waiting to start. Show the current
    // one as the subscription and describe the replacement separately.
    const scheduled = live.find(x => x.currentStart && x.currentStart > new Date() && x.paidCount === 0) || null;
    const sub = live.find(x => x !== scheduled) || live[0];

    res.json({
      subscription: {
        id: sub.customId,
        tier: sub.tier,
        billingCycle: sub.billingCycle,
        amount: sub.amount / 100,
        status: sub.status,
        currentEnd: sub.currentEnd,
        chargeAt: sub.chargeAt,
        cancelAtCycleEnd: sub.cancelAtCycleEnd,
        cancelledAt: sub.cancelledAt,
        willRenew: sub.willRenew(),
        paidCount: sub.paidCount,
        lastFailedAt: sub.lastFailedAt,
      },
      scheduledChange: scheduled ? {
        tier: scheduled.tier,
        billingCycle: scheduled.billingCycle,
        amount: scheduled.amount / 100,
        startsAt: scheduled.currentStart,
      } : null,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Could not load your subscription.' });
  }
};

// Core cancellation, callable without an Express request so the legacy
// autopay shim can reuse it. Returns { ok, status, body } for the caller to
// hand straight back to res.
async function cancelForUser(userId, { immediate = false, reason = '' } = {}) {
  const sub = await Subscription.findOne({
    userId,
    status: { $in: Subscription.LIVE_STATUSES },
  });
  if (!sub) {
    return { ok: false, status: 404, body: { error: 'You do not have an active auto-renewing plan.' } };
  }
  if (sub.cancelAtCycleEnd && !immediate) {
    return {
      ok: false,
      status: 409,
      body: {
        error: 'This plan is already set to cancel at the end of the current period.',
        code: 'ALREADY_CANCELLING',
      },
    };
  }

  let remote = null;
  try {
    remote = await razorpay.cancelSubscription(sub.razorpaySubscriptionId, !immediate);
  } catch (err) {
    console.error('Razorpay cancel error:', err);
    return {
      ok: false,
      status: 502,
      body: { error: 'Could not cancel with our payment provider. Please try again.' },
    };
  }

  sub.cancelledAt = new Date();
  sub.cancellationReason = String(reason).slice(0, 500);
  if (immediate) {
    sub.endedAt = new Date();
  } else {
    sub.cancelAtCycleEnd = true;
  }
  await syncSubscriptionFromRemote(sub, remote, { skipSave: true });
  // Razorpay reports cancel-at-cycle-end subscriptions as still 'active';
  // only an immediate cancellation ends it now, and the mirror above must not
  // overwrite that.
  if (immediate) sub.status = 'cancelled';
  await sub.save();

  const user = await User.findById(userId);

  // Immediate cancellation forfeits the rest of the paid period, so revoke
  // access now. End-of-cycle cancellation leaves premiumUntil untouched.
  if (immediate && user) {
    user.premiumUntil = new Date();
    user.tier = 'free';
    syncPlanFromTier(user);
    await user.save();
  }

  await syncAutopayFlag(userId);

  const accessUntil = immediate ? null : (sub.currentEnd || user?.premiumUntil || null);

  if (user) {
    notify.subscriptionCancelled(user.email, {
      role: user.role,
      tier: sub.tier,
      immediate,
      accessUntil,
    });
  }

  return {
    ok: true,
    status: 200,
    body: {
      message: immediate
        ? 'Your plan has been cancelled and Premium access has ended.'
        : 'Auto-renewal is off. You keep Premium until the end of the current period.',
      immediate,
      accessUntil,
    },
  };
}

exports.cancelForUser = cancelForUser;

// ─────────────────────────────────────────
// CANCEL SUBSCRIPTION
//
// Default is cancel-at-cycle-end: the user keeps everything they've paid for
// and simply isn't charged again. `immediate` ends access now and is only
// offered as an explicit second choice, because it forfeits paid time
// (see the Refund & Cancellation Policy).
// ─────────────────────────────────────────
exports.cancelSubscription = async (req, res) => {
  try {
    const { immediate = false, reason = '' } = req.body || {};
    const result = await cancelForUser(req.userId, { immediate: !!immediate, reason });
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Something went wrong cancelling your plan.' });
  }
};

// ─────────────────────────────────────────
// RESUME  (undo a not-yet-effective cancellation)
//
// Razorpay cannot un-cancel a subscription, so "resume" means starting a
// fresh subscription. Only offered while the old one is still inside its paid
// period — the new schedule simply picks up when that runs out.
// ─────────────────────────────────────────
exports.resumeSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      userId: req.userId,
      status: { $in: Subscription.LIVE_STATUSES },
      cancelAtCycleEnd: true,
    });
    if (!sub) {
      return res.status(404).json({ error: 'You have no cancelling plan to resume.' });
    }

    res.json({
      message: 'Re-enable auto-renewal by starting a new plan — your remaining paid days are kept.',
      code: 'RESUME_REQUIRES_CHECKOUT',
      tier: sub.tier,
      billingCycle: sub.billingCycle,
      accessUntil: sub.currentEnd,
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
