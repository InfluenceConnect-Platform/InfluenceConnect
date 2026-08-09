const mongoose = require('mongoose');

// Razorpay Plans are immutable and permanent once created, so we create one
// per role+tier+billingCycle+amount the first time it's needed and reuse it
// forever afterwards. Caching the id here avoids creating a duplicate Plan on
// every checkout (Razorpay would happily accept them, leaving the dashboard
// full of identical throwaway plans).
//
// amountPaise is part of the key on purpose: if pricing ever changes, a NEW
// Plan is created rather than silently re-pointing existing subscribers at a
// different amount — Razorpay cannot change a Plan's price in place, and
// existing subscribers must keep paying what they agreed to.
const razorpayPlanSchema = new mongoose.Schema({
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

  amountPaise: {
    type: Number,
    required: true
  },

  razorpayPlanId: {
    type: String,
    required: true,
    unique: true
  }

}, { timestamps: true });

razorpayPlanSchema.index(
  { role: 1, tier: 1, billingCycle: 1, amountPaise: 1 },
  { unique: true }
);

module.exports = mongoose.model('RazorpayPlan', razorpayPlanSchema);
