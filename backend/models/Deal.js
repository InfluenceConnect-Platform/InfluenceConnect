const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },

  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
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

  agreedAmount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['in-progress', 'content-submitted', 'completed', 'cancelled'],
    default: 'in-progress'
  },

  startedAt: {
    type: Date,
    default: Date.now
  },

  completedAt: {
    type: Date,
    default: null
  },

  negotiationStatus: {
    type: String,
    enum: ['open', 'agreed'],
    default: 'open'
  },

  offers: [{
    amount: { type: Number, required: true },
    reason: { type: String, default: '' },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proposedByRole: { type: String, enum: ['brand', 'influencer'], required: true },
    status: { type: String, enum: ['pending', 'accepted', 'countered'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

// Inbox lists filter by brand/influencer and sort by most recent activity.
dealSchema.index({ brandId: 1, updatedAt: -1 });
dealSchema.index({ influencerId: 1, updatedAt: -1 });
// Deal lookups by the originating application.
dealSchema.index({ applicationId: 1 });

module.exports = mongoose.model('Deal', dealSchema);