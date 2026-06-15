const mongoose = require('mongoose');
const generateId = require('../utils/generateId');

const applicationSchema = new mongoose.Schema({
  // Human-readable public ID (IC-APP-000001). Auto-generated on first save.
  customId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

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
    enum: ['applied', 'shortlisted', 'accepted', 'rejected', 'on-hold'],
    default: 'applied'
  },

  // When the brand last changed this application's status. Drives the "unseen
  // application update" dot on the influencer's Campaigns tab.
  statusUpdatedAt: {
    type: Date
  }

}, { timestamps: true });

// Prevent duplicate applications
applicationSchema.index(
  { campaignId: 1, influencerId: 1 },
  { unique: true }
);

// Brand-wide application lists, newest first (dashboard + counts).
applicationSchema.index({ brandId: 1, createdAt: -1 });

// Assign a human-readable customId on first save.
applicationSchema.pre('save', async function() {
  if (!this.customId) {
    this.customId = await generateId('application');
  }
});

module.exports = mongoose.model('Application', applicationSchema);