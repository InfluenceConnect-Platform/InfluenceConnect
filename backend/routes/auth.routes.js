const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { register, verifyOTP, login, sendMobileOtp } = require('../controllers/auth.controller');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/send-mobile-otp  (Google OAuth completion step)
router.post('/send-mobile-otp', sendMobileOtp);

// GET /api/auth/google  — start Google OAuth flow
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account consent'   // always show account picker + consent screen
}));

// GET /api/auth/google/callback  — Google redirects here
router.get('/google/callback', (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      // Email is registered via email/password — tell them to use password
      if (info?.message === 'email_exists') {
        return res.redirect(`${frontendUrl}/auth/login?error=email_exists`);
      }
      return res.redirect(`${frontendUrl}/auth/login?error=google_failed`);
    }

    // New Google user — mobile not yet collected
    if (!user.mobileVerified) {
      return res.redirect(`${frontendUrl}/auth/complete-profile?userId=${user._id}&step=mobile`);
    }

    // Fully verified user — issue JWT and go to dashboard
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userPayload = encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan
    }));

    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&user=${userPayload}`);
  })(req, res, next);
});

module.exports = router;
