const mongoose = require('mongoose');
const generateId = require('../utils/generateId');

// One document per Razorpay Subscription — the auto-renewing counterpart to
// the one-time Payment model. Razorpay owns the schedule and raises each
// charge itself; this mirrors its state so the app can answer "is this user
// on auto-renewal, when is the next debit, and can they cancel" without
// calling Razorpay on every page load.
//
// Status values mirror Razorpay's own subscription states:
//   created       — subscription made, mandate not yet authorised
//   authenticated — mandate approved, first charge not yet raised
//   active        — charging normally
//   pending       — a charge failed; Razorpay is retrying
//   halted        — retries exhausted; no further charges without user action
//   cancelled     — ended by the user (or by us on their behalf)
//   completed     — ran out its total_count of cycles
//   expired       — mandate was never authorised in time
const subscriptionSchema = new mongoose.Schema({
  // Human-readable public ID (IC-SUB-000001). Auto-generated on first save.
  customId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  role: {
    type: String,
    enum: ['influencer', 'brand'],
    required: true
  },

  tier: {
    type: String,
    required: true
  },

  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },

  // Recurring amount per cycle, in paise. Stored so a later price change
  // never rewrites what an existing subscriber actually agreed to pay.
  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: 'INR'
  },

  razorpaySubscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  razorpayPlanId: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'],
    default: 'created',
    index: true
  },

  // Current paid period, mirrored from Razorpay's current_start/current_end.
  currentStart: { type: Date, default: null },
  currentEnd:   { type: Date, default: null },

  // When Razorpay will next attempt a debit.
  chargeAt: { type: Date, default: null },

  // Set when the user cancels but chose to keep access until the period ends.
  // While true the subscription is still 'active' on Razorpay but will not
  // renew — the UI must show "cancels on <currentEnd>", not "renews on".
  cancelAtCycleEnd: {
    type: Boolean,
    default: false
  },

  cancelledAt: { type: Date, default: null },
  endedAt:     { type: Date, default: null },

  // Optional free-text reason captured from the cancellation dialog. Used for
  // churn analysis only; never required.
  cancellationReason: {
    type: String,
    default: ''
  },

  // How many cycles Razorpay has successfully charged.
  paidCount:  { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },

  // Set when a charge fails, cleared when one succeeds — drives the
  // "payment failed, update your method" banner and the dunning emails.
  lastFailedAt: { type: Date, default: null }

}, { timestamps: true });

subscriptionSchema.index({ userId: 1, createdAt: -1 });

// A user may only have one subscription that is live at a time. Partial index
// so cancelled/completed rows don't collide.
subscriptionSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['created', 'authenticated', 'active', 'pending', 'halted'] }
    }
  }
);

// Statuses where the user still has (or is about to have) paid access.
subscriptionSchema.statics.LIVE_STATUSES = ['created', 'authenticated', 'active', 'pending', 'halted'];

// True when Razorpay will raise another charge on its own.
subscriptionSchema.methods.willRenew = function () {
  return ['authenticated', 'active', 'pending'].includes(this.status) && !this.cancelAtCycleEnd;
};

subscriptionSchema.pre('save', async function () {
  if (!this.customId) {
    this.customId = await generateId('subscription');
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
