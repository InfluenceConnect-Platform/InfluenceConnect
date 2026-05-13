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

// ─────────────────────────────────────────
// Middleware — MUST come before all routes
// ─────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
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
    process.exit(1);
  });

// ─────────────────────────────────────────
// Routes — MUST come after middleware
// ─────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/influencer', require('./routes/influencer.routes'));
app.use('/api/upload', require('./routes/upload.routes'));

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});