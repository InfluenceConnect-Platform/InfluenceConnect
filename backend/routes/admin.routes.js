const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const adminOnly = require('../middleware/admin.middleware');
const {
  getOverviewStats,
  getAllUsers,
  updateUserStatus,
  getAllCampaigns,
  removeCampaign,
  getPendingGSTIN,
  updateGSTINStatus,
  getSubscriptionOverview
} = require('../controllers/admin.controller');

// All admin routes require auth + admin role
router.use(authenticate, adminOnly);

router.get('/stats', getOverviewStats);
router.get('/users', getAllUsers);
router.put('/users/:userId/status', updateUserStatus);
router.get('/campaigns', getAllCampaigns);
router.put('/campaigns/:campaignId/remove', removeCampaign);
router.get('/gstin/pending', getPendingGSTIN);
router.put('/gstin/:brandProfileId/status', updateGSTINStatus);
router.get('/subscriptions/overview', getSubscriptionOverview);

module.exports = router;