const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Validate required env vars. Only vars the app cannot run at all without
// are hard-required here — a missing Google/Razorpay/cron var should disable
// that one feature, not crash every request on the whole site.
const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
}

const optional = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET', 'CRON_SECRET'];
for (const key of optional) {
  if (!process.env[key]) {
    console.warn(`Missing optional env variable: ${key} — related features will be unavailable.`);
  }
}

require('./config/passport');

const app = express();
const PORT = process.env.PORT || 8000;

// Vercel terminates TLS and proxies over HTTP internally — without this,
// req.protocol always reports 'http', breaking the Google OAuth callback URL
// and the CORS/redirect logic in auth.routes.js that depends on https.
app.set('trust proxy', 1);

// ─────────────────────────────────────────
// Middleware — MUST come before all routes
// ─────────────────────────────────────────
// Allow requests from localhost AND from any device on the local network
// (e.g. a phone at http://10.15.144.238:3000).  Private LAN ranges are safe
// to whitelist; this guard is removed in production where FRONTEND_URL is set
// to the real domain.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // server-to-server / curl
    // Explicit allow-list from env (production)
    const allowed = process.env.FRONTEND_URL;
    if (allowed && origin === allowed) return callback(null, true);
    // The localhost / private-LAN escape hatches below exist so a phone on the
    // same Wi-Fi can hit a laptop's dev server. They must NOT survive into
    // production: with credentials:true they would let any page served from a
    // private address (or an attacker's box on a shared network) read
    // authenticated responses from the live API.
    if (!IS_PRODUCTION) {
      // localhost / 127.0.0.1 (dev machine)
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      // Private LAN ranges: 10.x, 172.16-31.x, 192.168.x
      if (/^https?:\/\/(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(origin)) return callback(null, true);
    }
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  credentials: true,
}));

// Baseline security response headers. Kept hand-rolled rather than pulling in
// helmet so the deployed dependency set stays unchanged.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.removeHeader('X-Powered-By');
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
// Captures the raw request body alongside express's parsed JSON, needed to
// verify the Razorpay webhook's HMAC signature (payment.controller.js).
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
// Strip Mongo query operators ($ne, $gt, dotted paths) out of request data
// before any controller builds a Mongoose filter from it — see the middleware
// for the login/OTP attacks this closes.
app.use(require('./middleware/sanitize.middleware').sanitizeRequest);
app.use(session({
  // Falls back to JWT_SECRET so existing deployments keep working, but prefer
  // a distinct SESSION_SECRET: reusing the token-signing key for cookie
  // signing means one leak compromises both.
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,   // HTTPS-only in production; plain HTTP in local dev
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());


// ─────────────────────────────────────────
// Database connection
// ─────────────────────────────────────────
// M0 (free tier) is shared infrastructure and intermittently stalls the TLS
// handshake under connection churn from serverless cold starts. Retry a few
// times before giving up instead of leaving the instance permanently
// "Disconnected" for what's usually a transient hiccup.
async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error(`MongoDB connection failed (attempt ${attempt}):`, err.message);
    if (attempt < 3) {
      setTimeout(() => connectWithRetry(attempt + 1), 2000);
    }
  }
}
connectWithRetry();

// ─────────────────────────────────────────
// Routes — MUST come after middleware
// ─────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/influencer', require('./routes/influencer.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/campaigns', require('./routes/campaign.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/deals', require('./routes/deal.routes'));
app.use('/api/invitations', require('./routes/invitation.routes'));
app.use('/api/brand', require('./routes/brand.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
// Protected test route
const authenticate = require('./middleware/auth.middleware');
app.get('/api/protected', authenticate, (req, res) => {
  res.json({
    message: `Hello ${req.user.name}, you are authenticated.`,
    role: req.user.role
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Backend is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Start server (skipped on Vercel, which imports `app` as a serverless function)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;