const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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

  premiumUntil: {
    type: Date,
    default: null
  }

}, {
  timestamps: true   // automatically adds createdAt and updatedAt
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