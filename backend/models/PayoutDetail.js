const mongoose = require('mongoose');

// One payout submission per deal — captured fresh per deal rather than reused
// from a profile-level default, so it can't go stale across an influencer's
// different collaborations. Account number / IFSC / UPI ID are stored
// encrypted (see utils/payoutCrypto.js); everything else here is plain.
const payoutDetailSchema = new mongoose.Schema({
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true,
    unique: true
  },

  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  method: {
    type: String,
    enum: ['bank', 'upi'],
    required: true
  },

  accountHolderName: {
    type: String,
    default: ''
  },

  // Encrypted ("iv:authTag:ciphertext" hex string) — empty when not applicable
  // to the chosen method.
  accountNumberEnc: {
    type: String,
    default: ''
  },
  ifscCodeEnc: {
    type: String,
    default: ''
  },
  upiIdEnc: {
    type: String,
    default: ''
  },

  paid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date,
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('PayoutDetail', payoutDetailSchema);
