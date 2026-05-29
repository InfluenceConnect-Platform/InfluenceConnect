const mongoose = require('mongoose');

// A brand proactively inviting an influencer to a campaign.
// This is a PRE-DEAL stage — no Deal/chat exists until the influencer accepts.
const invitationSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },

  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // The influencer's User account that receives the invitation.
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Optional personal note from the brand.
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    default: ''
  },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },

  respondedAt: {
    type: Date,
    default: null
  },

  // Populated once the influencer accepts and a Deal is generated.
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    default: null
  },

  // False until the brand has viewed the influencer's accept/reject response
  // (drives the brand-side notification badge).
  brandSeenResponse: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

// One live invitation per campaign+influencer pair.
invitationSchema.index({ campaignId: 1, influencerId: 1 }, { unique: true });

// Influencer inbox + brand sent-list lookups, newest first.
invitationSchema.index({ influencerId: 1, createdAt: -1 });
invitationSchema.index({ brandId: 1, createdAt: -1 });

module.exports = mongoose.model('Invitation', invitationSchema);
