const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/auth.middleware');
const { register, verifyOTP, resendOTP, login, sendMobileOtp, forgotPassword, resetPassword, upgradePlan, downgradePlan } = require('../controllers/auth.controller');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOTP);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/send-mobile-otp  (Google OAuth completion step)
router.post('/send-mobile-otp', sendMobileOtp);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// POST /api/auth/upgrade  — bypass payment, set plan = premium
router.post('/upgrade', authenticate, upgradePlan);

// POST /api/auth/downgrade  — revert to freemium
router.post('/downgrade', authenticate, downgradePlan);

// Derive the backend/frontend origin from the incoming request so that OAuth
// works correctly whether the request comes from localhost or a phone on the
// local network (e.g. http://10.15.144.238:3000).
const getBackendUrl = (req) =>
  `${req.protocol}://${req.hostname}:${process.env.PORT || 8000}`;

const getFrontendUrl = (req) =>
  `${req.protocol}://${req.hostname}:3000`;

// GET /api/auth/google  — start Google OAuth flow
router.get('/google', (req, res, next) => {
  const callbackURL = `${getBackendUrl(req)}/api/auth/google/callback`;
  const role = req.query.role === 'brand' ? 'brand' : 'influencer';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account consent',
    callbackURL,
    state: role,
  })(req, res, next);
});

// GET /api/auth/google/callback  — Google redirects here
router.get('/google/callback', (req, res, next) => {
  const callbackURL = `${getBackendUrl(req)}/api/auth/google/callback`;
  const frontendUrl = getFrontendUrl(req);

  passport.authenticate('google', { session: false, callbackURL }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
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
      plan: user.plan,
    }));

    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&user=${userPayload}`);
  })(req, res, next);
});

module.exports = router;
