const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const influencerOnly = authenticate.influencerOnly;
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

// All routes below require authentication and influencer role
router.post('/profile', authenticate, influencerOnly, createProfile);
router.get('/profile/me', authenticate, influencerOnly, getMyProfile);
router.put('/profile', authenticate, influencerOnly, updateProfile);
router.get('/deals', authenticate, influencerOnly, getMyDeals);
router.put('/deals/:dealId/status', authenticate, influencerOnly, updateDealStatus);
router.get('/earnings', authenticate, influencerOnly, getEarnings);
router.get('/stats-history', authenticate, influencerOnly, getStatsHistory);
router.delete('/applications/:applicationId', authenticate, influencerOnly, withdrawApplication);

// Public route — no auth needed
router.get('/profile/:slug', getPublicProfile);

module.exports = router;
