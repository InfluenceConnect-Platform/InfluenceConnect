const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  sendInvitations,
  getBrandInvitations,
  getBrandResponseCount,
  markBrandResponsesSeen,
  getInfluencerInvitations,
  getInfluencerPendingCount,
  respondToInvitation,
} = require('../controllers/invitation.controller');

// ── Brand ──
router.post('/', authenticate, sendInvitations);
router.get('/brand', authenticate, getBrandInvitations);
router.get('/brand/response-count', authenticate, getBrandResponseCount);
router.put('/brand/seen', authenticate, markBrandResponsesSeen);

// ── Influencer ──
router.get('/influencer', authenticate, getInfluencerInvitations);
router.get('/influencer/pending-count', authenticate, getInfluencerPendingCount);
router.put('/:invitationId/respond', authenticate, respondToInvitation);

module.exports = router;
