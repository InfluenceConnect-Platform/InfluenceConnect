const mongoose = require('mongoose');
const generateId = require('../utils/generateId');

// One document per Premium checkout attempt — created when a Razorpay Order
// is issued, then updated to 'paid'/'failed' once the payment resolves.
// razorpayPaymentId doubles as the idempotency key: both the client-side
// /verify call and the /webhook can race to confirm the same payment, and
// only the first one to see status !== 'paid' actually applies the upgrade.
const paymentSchema = new mongoose.Schema({
  // Human-readable public ID (IC-PAY-000001). Auto-generated on first save.
  customId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  role: {
    type: String,
    enum: ['influencer', 'brand'],
    required: true
  },

  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },

  // Which tier this purchase was for — see backend/utils/tiers.js.
  tier: {
    type: String,
    default: 'silver'
  },

  amount: {
    type: Number, // paise
    required: true
  },

  currency: {
    type: String,
    default: 'INR'
  },

  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },

  razorpayPaymentId: {
    type: String,
    unique: true,
    sparse: true
  },

  razorpaySignature: {
    type: String,
    default: ''
  },

  // Razorpay's payment method (card / upi / netbanking / wallet / emi …),
  // fetched from the payment entity once it's captured.
  method: {
    type: String,
    default: ''
  },

  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created'
  }

}, { timestamps: true });

paymentSchema.index({ userId: 1, createdAt: -1 });

// Assign a human-readable customId on first save.
paymentSchema.pre('save', async function() {
  if (!this.customId) {
    this.customId = await generateId('payment');
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
