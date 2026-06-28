const mongoose = require('mongoose');

// Immutable audit trail of admin actions. One document per action taken.
// Names are snapshotted at write time so the log stays accurate even if the
// admin or the affected record is later renamed or deleted.
const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  adminName: {
    type: String,
    default: ''
  },

  action: {
    type: String,
    enum: [
      'USER_SUSPENDED',
      'USER_RESTORED',
      'USER_VIEWED',
      'GSTIN_APPROVED',
      'GSTIN_REJECTED',
      'GSTIN_REOPENED',
      'CAMPAIGN_REMOVED',
      'CAMPAIGN_FLAGGED',
      'CAMPAIGN_VIEWED',
      'ADMIN_LOGIN',
      'SYSTEM_NOTE'
    ],
    required: true
  },

  targetType: {
    type: String,
    enum: ['user', 'campaign', 'gstin', 'system'],
    required: true
  },

  // The human-readable customId of the affected record (e.g. IC-INF-000001).
  targetId: {
    type: String,
    default: ''
  },

  targetName: {
    type: String,
    default: ''
  },

  details: {
    type: String,
    default: ''
  },

  // Free-form extra context: previous/new status, reason, counts, etc.
  metadata: {
    type: Object,
    default: {}
  },

  ipAddress: {
    type: String,
    default: ''
  }

}, {
  // Audit logs only ever need the creation time.
  timestamps: { createdAt: true, updatedAt: false }
});

// Newest-first listing + common filters.
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
