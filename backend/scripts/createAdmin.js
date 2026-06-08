require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Bootstrap-only credentials. These just seed the FIRST admin account; the
// admin is expected to change the email + password from the in-app Admin
// Settings page afterwards. Prefer env vars so nothing sensitive lives in
// source control — the literals below are only a development fallback.
const adminData = {
  name: process.env.ADMIN_NAME || 'Influence Connect Admin',
  email: (process.env.ADMIN_EMAIL || 'influenceconnect.app@gmail.com').toLowerCase(),
  mobile: process.env.ADMIN_MOBILE || '+919000000000',
  password: process.env.ADMIN_PASSWORD || 'Admin@Secure2026',   // plain text — the model pre-save hook hashes it
  role: 'admin',
  emailVerified: true,
  mobileVerified: true,
  status: 'active',
  plan: 'freemium',
};

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: adminData.email });

  if (existing) {
    // Admin exists — could have a broken (double-hashed) password from a previous
    // run of the old script.  Reset the password so the pre-save hook hashes it
    // exactly once.
    const isCorrect = await existing.comparePassword(adminData.password);

    if (isCorrect) {
      console.log('Admin already exists and password is correct. Nothing to do.');
      console.log('  Email:', existing.email);
      console.log('  Role :', existing.role);
      process.exit(0);
    }

    // Password is wrong (double-hash bug) — fix it
    existing.password = adminData.password;   // plain text triggers isModified → hook hashes it
    await existing.save();
    console.log('Admin password was broken (double-hash). Fixed successfully.');
    console.log('  Email:', existing.email);
    console.log('  Role :', existing.role);
    process.exit(0);
  }

  // Brand-new admin — pass plain password; pre-save hook hashes it once
  const admin = await User.create(adminData);

  console.log('Admin created successfully:');
  console.log('  Email:', admin.email);
  console.log('  Role :', admin.role);
  console.log('  Status:', admin.status);
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Error creating/fixing admin:', err);
  process.exit(1);
});
