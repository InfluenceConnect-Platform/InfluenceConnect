const Deal = require('../models/Deal');

// Stringify all ObjectIds in the offers array so frontend === comparisons work
function normalizeOffers(offers = []) {
  return offers.map(o => ({
    ...o,
    _id: o._id.toString(),
    proposedBy: o.proposedBy.toString(),
  }));
}

// ─────────────────────────────────────────
// PENDING OFFER COUNT (for nav dot)
// ─────────────────────────────────────────
exports.getPendingOfferCount = async (req, res) => {
  try {
    const userId = req.userId.toString();
    const deals = await Deal.find({
      $or: [{ brandId: req.userId }, { influencerId: req.userId }],
      negotiationStatus: 'open',
      'offers.status': 'pending',
    }).select('offers brandId influencerId');

    let count = 0;
    for (const deal of deals) {
      const pending = deal.offers.filter(o => o.status === 'pending');
      const latest = pending[pending.length - 1];
      if (latest && latest.proposedBy.toString() !== userId) count++;
    }

    res.json({ count });
  } catch (error) {
    console.error('Get pending offer count error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET DEAL STATE (for real-time polling)
// ─────────────────────────────────────────
exports.getDeal = async (req, res) => {
  try {
    const { dealId } = req.params;

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found.' });

    const isBrand      = deal.brandId.toString()     === req.userId.toString();
    const isInfluencer = deal.influencerId.toString() === req.userId.toString();
    if (!isBrand && !isInfluencer) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({
      status: deal.status,
      offers: normalizeOffers(deal.toObject().offers || []),
      negotiationStatus: deal.negotiationStatus,
      agreedAmount: deal.agreedAmount,
    });
  } catch (error) {
    console.error('Get deal state error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// MAKE OFFER
// ─────────────────────────────────────────
exports.makeOffer = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { amount, reason } = req.body;

    const parsed = Number(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ error: 'Please enter a valid offer amount.' });
    }

    const deal = await Deal.findById(dealId)
      .populate('campaignId', 'budgetMin budgetMax title niche deliverables');
    if (!deal) return res.status(404).json({ error: 'Deal not found.' });

    const isBrand      = deal.brandId.toString()      === req.userId.toString();
    const isInfluencer = deal.influencerId.toString()  === req.userId.toString();
    if (!isBrand && !isInfluencer) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (['completed', 'cancelled'].includes(deal.status)) {
      return res.status(400).json({ error: 'Cannot make offers on a closed deal.' });
    }

    if (deal.negotiationStatus === 'agreed') {
      return res.status(400).json({ error: 'The price has already been agreed.' });
    }

    const { budgetMin, budgetMax } = deal.campaignId;
    if (parsed < budgetMin || parsed > budgetMax) {
      return res.status(400).json({
        error: `Offer must be between ₹${budgetMin.toLocaleString('en-IN')} and ₹${budgetMax.toLocaleString('en-IN')}.`
      });
    }

    // Mark all previously pending offers as countered
    deal.offers.forEach(o => { if (o.status === 'pending') o.status = 'countered'; });

    deal.offers.push({
      amount: parsed,
      reason: (reason || '').trim().slice(0, 300),
      proposedBy: req.userId,
      proposedByRole: isBrand ? 'brand' : 'influencer',
      status: 'pending',
    });

    await deal.save();

    res.json({
      negotiationStatus: deal.negotiationStatus,
      agreedAmount: deal.agreedAmount,
      offers: normalizeOffers(deal.toObject().offers),
    });
  } catch (error) {
    console.error('Make offer error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// ACCEPT OFFER
// ─────────────────────────────────────────
exports.acceptOffer = async (req, res) => {
  try {
    const { dealId } = req.params;

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: 'Deal not found.' });

    const isBrand      = deal.brandId.toString()      === req.userId.toString();
    const isInfluencer = deal.influencerId.toString()  === req.userId.toString();
    if (!isBrand && !isInfluencer) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (deal.negotiationStatus === 'agreed') {
      return res.status(400).json({ error: 'The price has already been agreed.' });
    }

    const pendingOffers = deal.offers.filter(o => o.status === 'pending');
    const latest = pendingOffers[pendingOffers.length - 1];

    if (!latest) {
      return res.status(400).json({ error: 'No pending offer to accept.' });
    }

    if (latest.proposedBy.toString() === req.userId.toString()) {
      return res.status(400).json({ error: 'You cannot accept your own offer.' });
    }

    latest.status = 'accepted';
    deal.agreedAmount = latest.amount;
    deal.negotiationStatus = 'agreed';

    await deal.save();

    res.json({
      negotiationStatus: deal.negotiationStatus,
      agreedAmount: deal.agreedAmount,
      offers: normalizeOffers(deal.toObject().offers),
    });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
