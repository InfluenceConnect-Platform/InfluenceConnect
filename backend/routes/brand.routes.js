const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  createProfile,
  getMyProfile,
  updateProfile,
  createCampaign,
  getMyCampaigns,
  getCampaignApplications,
  updateApplicationStatus,
  discoverInfluencers,
  getDashboardStats
} = require('../controllers/brand.controller');

router.post('/profile', authenticate, createProfile);
router.get('/profile/me', authenticate, getMyProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.post('/campaigns', authenticate, createCampaign);
router.get('/campaigns', authenticate, getMyCampaigns);
router.get('/campaigns/:campaignId/applications', authenticate, getCampaignApplications);
router.put('/applications/:applicationId/status', authenticate, updateApplicationStatus);
router.get('/discover', authenticate, discoverInfluencers);

module.exports = router;