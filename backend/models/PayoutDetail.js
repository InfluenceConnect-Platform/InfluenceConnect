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
  },

  // Proof of payment — a transaction/UTR reference plus a receipt file,
  // required from the brand at the moment they mark a deal paid. Not
  // sensitive the way bank details are (comparable to an invoice number), so
  // left unencrypted for easy admin dispute-resolution lookup.
  transactionRef: {
    type: String,
    default: ''
  },
  receiptUrl: {
    type: String,
    default: ''
  },
  receiptFileName: {
    type: String,
    default: ''
  }

}, { timestamps: true });

module.exports = mongoose.model('PayoutDetail', payoutDetailSchema);
