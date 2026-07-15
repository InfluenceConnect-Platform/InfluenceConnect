const User = require('../models/User');

// All active admin accounts' emails — used to fan out admin-facing notifications
// (e.g. a new GSTIN needs review) without hardcoding a single inbox.
async function getAdminEmails() {
  const admins = await User.find({ role: 'admin' }).select('email');
  return admins.map((a) => a.email).filter(Boolean);
}

module.exports = { getAdminEmails };
