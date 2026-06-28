const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const brandOnly = authenticate.brandOnly;
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

router.post('/profile', authenticate, brandOnly, createProfile);
router.get('/profile/me', authenticate, brandOnly, getMyProfile);
router.put('/profile', authenticate, brandOnly, updateProfile);
router.get('/dashboard/stats', authenticate, brandOnly, getDashboardStats);
router.post('/campaigns', authenticate, brandOnly, createCampaign);
router.get('/campaigns', authenticate, brandOnly, getMyCampaigns);
router.get('/new-applicants-count', authenticate, brandOnly, getNewApplicantsCount);
router.put('/campaigns/:campaignId', authenticate, brandOnly, updateCampaign);
router.delete('/campaigns/:campaignId', authenticate, brandOnly, deleteCampaign);
router.get('/campaigns/:campaignId/applications', authenticate, brandOnly, getCampaignApplications);
router.put('/applications/:applicationId/status', authenticate, brandOnly, updateApplicationStatus);
router.get('/deals', authenticate, brandOnly, getMyDeals);
router.put('/deals/:dealId/status', authenticate, brandOnly, updateDealStatus);
router.get('/discover', authenticate, brandOnly, discoverInfluencers);
router.get('/influencer/:slug', authenticate, brandOnly, getInfluencerBySlug);

module.exports = router;
