const rateLimit = require('express-rate-limit');

// ─────────────────────────────────────────
// Rate limiters for the auth surface.
//
// Without these, the credential and OTP endpoints can be brute-forced:
// password spraying on /login, and guessing the 6-digit code on
// /verify-otp and /reset-password (only 1,000,000 combinations).
//
// NOTE for production: when deployed behind a reverse proxy / load balancer,
// set `app.set('trust proxy', 1)` in index.js so the real client IP (not the
// proxy's) is used for keying these limits.
// ─────────────────────────────────────────

const json = (res, message) =>
  res.status(429).json({ error: 'rate_limited', message });

// Strict limiter for the highest-risk endpoints: login and OTP verification.
// 10 attempts per 15 minutes per IP.
const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    json(res, 'Too many attempts. Please wait 15 minutes and try again.'),
});

// Looser limiter for endpoints that send emails/SMS (register, resend, forgot
// password). Curbs spamming a victim's inbox and abusing the email provider.
// 30 requests per 15 minutes per IP.
const accountActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    json(res, 'Too many requests. Please wait a few minutes and try again.'),
});

module.exports = { sensitiveAuthLimiter, accountActionLimiter };
