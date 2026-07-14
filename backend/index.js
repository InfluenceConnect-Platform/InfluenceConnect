const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Validate required env vars
const required = ['MONGODB_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
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
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // server-to-server / curl
    // Explicit allow-list from env (production)
    const allowed = process.env.FRONTEND_URL;
    if (allowed && origin === allowed) return callback(null, true);
    // localhost / 127.0.0.1 (dev machine)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    // Private LAN ranges: 10.x, 172.16-31.x, 192.168.x
    if (/^https?:\/\/(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


// ─────────────────────────────────────────
// Database connection
// ─────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
  });

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