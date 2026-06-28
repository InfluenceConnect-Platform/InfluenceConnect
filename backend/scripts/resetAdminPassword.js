require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Usage:
//   ADMIN_EMAIL=you@example.com ADMIN_NEW_PASSWORD=NewPass@123 node scripts/resetAdminPassword.js
//
// Both variables must be set. The new password is passed in plain text here;
// the User model's pre-save hook hashes it before it touches the database.

const email    = (process.env.ADMIN_EMAIL        || '').toLowerCase().trim();
const newPass  =  process.env.ADMIN_NEW_PASSWORD || '';

if (!email || !newPass) {
  console.error('Error: ADMIN_EMAIL and ADMIN_NEW_PASSWORD environment variables are required.');
  console.error('  Example: ADMIN_EMAIL=you@example.com ADMIN_NEW_PASSWORD=NewPass@123 node scripts/resetAdminPassword.js');
  process.exit(1);
}

if (newPass.length < 8) {
  console.error('Error: ADMIN_NEW_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

async function resetPassword() {
  await mongoose.connect(process.env.MONGODB_URI);

  const admin = await User.findOne({ email, role: 'admin' });

  if (!admin) {
    console.error(`Error: No admin account found with email "${email}".`);
    process.exit(1);
  }

  admin.password = newPass; // plain text — pre-save hook hashes it exactly once
  await admin.save();

  console.log('Admin password reset successfully.');
  console.log('  Email:', admin.email);
  console.log('  Name :', admin.name);
  console.log('Login at /admin/login with the new password.');
  process.exit(0);
}

resetPassword().catch(err => {
  console.error('Error resetting admin password:', err);
  process.exit(1);
});
