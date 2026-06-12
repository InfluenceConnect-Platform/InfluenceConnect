const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const adminOnly = require('../middleware/admin.middleware');
const {
  getOverviewStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllCampaigns,
  getCampaignDetails,
  removeCampaign,
  flagCampaign,
  getGstinVerifications,
  updateGSTINStatus,
  reopenGstinRejection,
  getSubscriptionOverview,
  getAdminLogs,
  getAdminLogStats
} = require('../controllers/admin.controller');

// All admin routes require auth + admin role
router.use(authenticate, adminOnly);

router.get('/stats', getOverviewStats);
router.get('/users', getAllUsers);
router.get('/users/:userId/details', getUserDetails);
router.put('/users/:userId/status', updateUserStatus);
router.get('/campaigns', getAllCampaigns);
router.get('/campaigns/:campaignId/details', getCampaignDetails);
router.put('/campaigns/:campaignId/remove', removeCampaign);
router.put('/campaigns/:campaignId/flag', flagCampaign);
router.get('/gstin', getGstinVerifications);
router.put('/gstin/:brandProfileId/status', updateGSTINStatus);
router.put('/gstin/:brandProfileId/reopen', reopenGstinRejection);
router.get('/subscriptions/overview', getSubscriptionOverview);
router.get('/logs/stats', getAdminLogStats);
router.get('/logs', getAdminLogs);

module.exports = router;