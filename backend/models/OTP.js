const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  type: {
    type: String,
    enum: ['email', 'mobile', 'password_reset', 'email_change', 'mobile_change'],
    required: true
  },

  otp: {
    type: String,
    required: true
  },

  // Stores the new email/mobile being verified during account updates
  pendingValue: {
    type: String,
    default: null
  },

  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },

  used: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// Auto delete OTP documents after they expire
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);