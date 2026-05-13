const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  createProfile,
  getMyProfile,
  updateProfile,
  getPublicProfile
} = require('../controllers/influencer.controller');

// All routes below require authentication
router.post('/profile', authenticate, createProfile);
router.get('/profile/me', authenticate, getMyProfile);
router.put('/profile', authenticate, updateProfile);

// Public route — no auth needed
router.get('/profile/:slug', getPublicProfile);

module.exports = router;