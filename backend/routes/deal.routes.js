const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { getDeal, makeOffer, acceptOffer, getPendingOfferCount } = require('../controllers/deal.controller');
const { submitPayoutDetails, getPayoutDetails, markAsPaid } = require('../controllers/payout.controller');

router.get('/pending-offer-count', authenticate, getPendingOfferCount);
router.get('/:dealId', authenticate, getDeal);
router.post('/:dealId/offer', authenticate, makeOffer);
router.put('/:dealId/offer/accept', authenticate, acceptOffer);
router.get('/:dealId/payout', authenticate, getPayoutDetails);
router.post('/:dealId/payout', authenticate, submitPayoutDetails);
router.put('/:dealId/payout/mark-paid', authenticate, markAsPaid);

module.exports = router;
