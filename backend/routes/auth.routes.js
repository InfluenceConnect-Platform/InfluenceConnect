const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/auth.middleware');
const { sensitiveAuthLimiter, accountActionLimiter } = require('../middleware/rateLimit.middleware');
const { register, verifyOTP, resendOTP, login, sendMobileOtp, forgotPassword, resetPassword, upgradePlan, downgradePlan, getAccountInfo, updateAccountInfo, changePassword, scheduleAccountDeletion, cancelAccountDeletion, requestEmailChange, verifyEmailChange, requestMobileChange, verifyMobileChange } = require('../controllers/auth.controller');

// POST /api/auth/register
router.post('/register', accountActionLimiter, register);

// POST /api/auth/verify-otp
router.post('/verify-otp', sensitiveAuthLimiter, verifyOTP);

// POST /api/auth/resend-otp
router.post('/resend-otp', accountActionLimiter, resendOTP);

// POST /api/auth/login
router.post('/login', sensitiveAuthLimiter, login);

// POST /api/auth/send-mobile-otp  (Google OAuth completion step)
router.post('/send-mobile-otp', accountActionLimiter, sendMobileOtp);

// POST /api/auth/forgot-password
router.post('/forgot-password', accountActionLimiter, forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', sensitiveAuthLimiter, resetPassword);

// POST /api/auth/upgrade  — bypass payment, set plan = premium
router.post('/upgrade', authenticate, upgradePlan);

// POST /api/auth/downgrade  — revert to freemium
router.post('/downgrade', authenticate, downgradePlan);

// GET  /api/auth/account  — get current user account info
router.get('/account', authenticate, getAccountInfo);

// PUT  /api/auth/account  — update name / email / mobile
router.put('/account', authenticate, updateAccountInfo);

// PUT  /api/auth/account/password  — change password
router.put('/account/password', authenticate, changePassword);

// POST /api/auth/account/delete  — schedule deletion (30-day grace)
router.post('/account/delete', authenticate, scheduleAccountDeletion);

// DELETE /api/auth/account/delete  — cancel scheduled deletion
router.delete('/account/delete', authenticate, cancelAccountDeletion);

// POST /api/auth/account/email/request  — send OTP to new email
router.post('/account/email/request', authenticate, requestEmailChange);

// POST /api/auth/account/email/verify  — verify OTP and apply new email
router.post('/account/email/verify', authenticate, verifyEmailChange);

// POST /api/auth/account/mobile/request  — send OTP to new mobile
router.post('/account/mobile/request', authenticate, requestMobileChange);

// POST /api/auth/account/mobile/verify  — verify OTP and apply new mobile
router.post('/account/mobile/verify', authenticate, verifyMobileChange);

// Derive the backend/frontend origin from the incoming request so that OAuth
// works correctly whether the request comes from localhost, a phone on the
// local network (e.g. http://10.15.144.238:3000), or a deployed domain —
// deployed hosts have no fixed dev port, so they use the configured URL.
const isLocalOrLan = (hostname) =>
  /^(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname);

const getBackendUrl = (req) =>
  isLocalOrLan(req.hostname)
    ? `${req.protocol}://${req.hostname}:${process.env.PORT || 8000}`
    : (process.env.BACKEND_URL || `${req.protocol}://${req.hostname}`);

const getFrontendUrl = (req) =>
  isLocalOrLan(req.hostname)
    ? `${req.protocol}://${req.hostname}:3000`
    : (process.env.FRONTEND_URL || `${req.protocol}://${req.hostname}`);

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

    // New Google user — mobile not yet collected.
    // Issue a short-lived signed token so the registration completion endpoint
    // cannot be called with an arbitrary userId from the URL.
    if (!user.mobileVerified) {
      const setupToken = jwt.sign(
        { userId: user._id, purpose: 'mobile-setup' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      return res.redirect(`${frontendUrl}/auth/complete-profile?setupToken=${setupToken}&step=mobile&role=${user.role}`);
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
