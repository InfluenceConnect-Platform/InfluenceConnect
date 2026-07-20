const mongoose = require('mongoose');

// One document per Premium checkout attempt — created when a Razorpay Order
// is issued, then updated to 'paid'/'failed' once the payment resolves.
// razorpayPaymentId doubles as the idempotency key: both the client-side
// /verify call and the /webhook can race to confirm the same payment, and
// only the first one to see status !== 'paid' actually applies the upgrade.
const paymentSchema = new mongoose.Schema({
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

  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created'
  }

}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
