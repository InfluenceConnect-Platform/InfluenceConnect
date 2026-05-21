const mongoose = require('mongoose');

const brandProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  companyName: {
    type: String,
    default: ''
  },

  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },

  industry: {
    type: String,
    enum: ['beauty', 'fashion', 'food', 'fitness', 'lifestyle',
           'travel', 'tech', 'books', 'other'],
    default: 'other'
  },

  website: {
    type: String,
    default: ''
  },

  gstin: {
    type: String,
    default: ''
  },

  gstinVerified: {
    type: Boolean,
    default: false
  },

  gstinStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'verified', 'rejected'],
    default: 'not_submitted'
  },

  logoUrl: {
    type: String,
    default: ''
  }

}, { timestamps: true });

module.exports = mongoose.model('BrandProfile', brandProfileSchema);