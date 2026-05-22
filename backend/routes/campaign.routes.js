const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  getCampaigns,
  getCampaignById,
  applyToCampaign,
  getMyApplications,
  seedCampaigns,
  getNewSinceCount
} = require('../controllers/campaign.controller');

// Public — browse campaigns
router.get('/', getCampaigns);
router.get('/new-since', getNewSinceCount);

// Protected — apply and view applications
router.get('/my-applications', authenticate, getMyApplications);
router.get('/:id', authenticate, getCampaignById);
router.post('/:id/apply', authenticate, applyToCampaign);

// Seed sample data (temporary — remove before production)
router.post('/seed', authenticate, seedCampaigns);

module.exports = router;