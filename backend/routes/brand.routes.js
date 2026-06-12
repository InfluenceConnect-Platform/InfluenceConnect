const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  createProfile,
  getMyProfile,
  updateProfile,
  createCampaign,
  getMyCampaigns,
  getNewApplicantsCount,
  getCampaignApplications,
  updateApplicationStatus,
  discoverInfluencers,
  getDashboardStats,
  getMyDeals,
  updateDealStatus,
  deleteCampaign,
  updateCampaign,
  getInfluencerBySlug,
} = require('../controllers/brand.controller');

router.post('/profile', authenticate, createProfile);
router.get('/profile/me', authenticate, getMyProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.post('/campaigns', authenticate, createCampaign);
router.get('/campaigns', authenticate, getMyCampaigns);
router.get('/new-applicants-count', authenticate, getNewApplicantsCount);
router.put('/campaigns/:campaignId', authenticate, updateCampaign);
router.delete('/campaigns/:campaignId', authenticate, deleteCampaign);
router.get('/campaigns/:campaignId/applications', authenticate, getCampaignApplications);
router.put('/applications/:applicationId/status', authenticate, updateApplicationStatus);
router.get('/deals', authenticate, getMyDeals);
router.put('/deals/:dealId/status', authenticate, updateDealStatus);
router.get('/discover', authenticate, discoverInfluencers);
router.get('/influencer/:slug', authenticate, getInfluencerBySlug);

module.exports = router;