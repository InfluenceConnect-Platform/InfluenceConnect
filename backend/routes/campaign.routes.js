const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  getCampaigns,
  getCampaignById,
  applyToCampaign,
  getMyApplications,
  seedCampaigns,
  getNewSinceCount,
  getApplicationUpdatesSince
} = require('../controllers/campaign.controller');

// Protected — campaigns are filtered by the influencer's own niches
router.get('/', authenticate, getCampaigns);
router.get('/new-since', getNewSinceCount);
router.get('/application-updates-since', authenticate, getApplicationUpdatesSince);

// Protected — apply and view applications
router.get('/my-applications', authenticate, getMyApplications);
router.get('/:id', authenticate, getCampaignById);
router.post('/:id/apply', authenticate, applyToCampaign);

// Seed sample data (temporary — remove before production)
router.post('/seed', authenticate, seedCampaigns);

module.exports = router;