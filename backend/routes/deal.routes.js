const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { getDeal, makeOffer, acceptOffer, getPendingOfferCount } = require('../controllers/deal.controller');

router.get('/pending-offer-count', authenticate, getPendingOfferCount);
router.get('/:dealId', authenticate, getDeal);
router.post('/:dealId/offer', authenticate, makeOffer);
router.put('/:dealId/offer/accept', authenticate, acceptOffer);

module.exports = router;
