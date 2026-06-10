const AdminLog = require('../models/AdminLog');

/**
 * Record an admin action in the audit trail.
 *
 * This MUST never throw — a logging failure should never break the main action
 * the admin just performed. All errors are swallowed (logged to console only).
 *
 * @param {Object} entry
 * @param {string} entry.adminId     - ObjectId of the acting admin
 * @param {string} entry.adminName   - admin name snapshot
 * @param {string} entry.action      - one of the AdminLog action enum values
 * @param {string} entry.targetType  - "user" | "campaign" | "gstin" | "system"
 * @param {string} entry.targetId    - customId of the affected record
 * @param {string} entry.targetName  - human-readable name of the affected record
 * @param {string} entry.details     - plain-English description
 * @param {Object} entry.metadata    - any extra context (prev/new status, reason…)
 * @param {string} entry.ipAddress   - request IP
 */
async function logAdminAction({
  adminId,
  adminName = '',
  action,
  targetType,
  targetId = '',
  targetName = '',
  details = '',
  metadata = {},
  ipAddress = '',
} = {}) {
  try {
    await AdminLog.create({
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      targetName,
      details,
      metadata,
      ipAddress,
    });
  } catch (err) {
    // Never let an audit-log write break the action that triggered it.
    console.error('logAdminAction failed:', err.message);
  }
}

module.exports = logAdminAction;
