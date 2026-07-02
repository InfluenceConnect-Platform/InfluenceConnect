const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const generateId = require('../utils/generateId');

const userSchema = new mongoose.Schema({
  // Human-readable, role-specific public ID (IC-INF-000001 / IC-BRD-000001 /
  // IC-ADM-000001). Auto-generated on first save; never shown as a raw ObjectId.
  customId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },

  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true
  },

  // Holds a mobile number that has been submitted but not yet OTP-verified.
  // Committed to `mobile` only when the OTP is confirmed in verifyOTP.
  pendingMobile: {
    type: String,
    default: null,
    trim: true
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },

  role: {
    type: String,
    enum: ['influencer', 'brand', 'admin'],
    required: [true, 'Role is required']
  },

  // Verification status
  emailVerified: {
    type: Boolean,
    default: false
  },

  mobileVerified: {
    type: Boolean,
    default: false
  },

  // Google OAuth
  googleId: {
    type: String,
    default: null
  },

  // Account status
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'pending'   // pending until OTP verified
  },

  // How this account was originally created
  signupMethod: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },

  // Subscription
  plan: {
    type: String,
    enum: ['freemium', 'premium'],
    default: 'freemium'
  },

  premiumStartedAt: {
    type: Date,
    default: null
  },

  premiumUntil: {
    type: Date,
    default: null
  },

  // Login brute-force protection
  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: {
    type: Date,
    default: null
  },

  // Soft-delete: set when user requests deletion; actual purge after 30 days
  deleteScheduledAt: {
    type: Date,
    default: null
  }

}, {
  timestamps: true   // automatically adds createdAt and updatedAt
});

// Assign a role-specific human-readable customId on first save.
userSchema.pre('save', async function() {
  if (!this.customId) {
    this.customId = await generateId(this.role);
  }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords at login
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);