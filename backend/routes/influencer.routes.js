const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  createProfile,
  getMyProfile,
  updateProfile,
  getPublicProfile,
  getEarnings,
  getMyDeals,
  updateDealStatus,
  getStatsHistory,
} = require('../controllers/influencer.controller');
const { withdrawApplication } = require('../controllers/campaign.controller');

// All routes below require authentication
router.post('/profile', authenticate, createProfile);
router.get('/profile/me', authenticate, getMyProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/deals', authenticate, getMyDeals);
router.put('/deals/:dealId/status', authenticate, updateDealStatus);
router.get('/earnings', authenticate, getEarnings);
router.get('/stats-history', authenticate, getStatsHistory);
router.delete('/applications/:applicationId', authenticate, withdrawApplication);

// Public route — no auth needed
router.get('/profile/:slug', getPublicProfile);

module.exports = router;