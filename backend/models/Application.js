const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
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

  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    default: ''
  },

  proposedRate: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'accepted', 'rejected'],
    default: 'applied'
  }

}, { timestamps: true });

// Prevent duplicate applications
applicationSchema.index(
  { campaignId: 1, influencerId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Application', applicationSchema);