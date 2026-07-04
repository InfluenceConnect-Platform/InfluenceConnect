const Deal = require('../models/Deal');
const PayoutDetail = require('../models/PayoutDetail');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const { encrypt, decrypt } = require('../utils/payoutCrypto');
const { postDealNotice } = require('../utils/dealNotice');
const notify = require('../services/email');

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_PATTERN = /^\d{9,18}$/;
const UPI_PATTERN = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;

function decryptForResponse(doc) {
  return {
    method: doc.method,
    accountHolderName: doc.accountHolderName,
    accountNumber: doc.accountNumberEnc ? decrypt(doc.accountNumberEnc) : '',
    ifscCode: doc.ifscCodeEnc ? decrypt(doc.ifscCodeEnc) : '',
    upiId: doc.upiIdEnc ? decrypt(doc.upiIdEnc) : '',
    paid: doc.paid,
    paidAt: doc.paidAt,
    transactionRef: doc.transactionRef || '',
    receiptUrl: doc.receiptUrl || '',
    receiptFileName: doc.receiptFileName || '',
    submittedAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function loadDealForParticipant(dealId, userId) {
  const deal = await Deal.findById(dealId);
  if (!deal) return { error: { status: 404, message: 'Deal not found.' } };

  const isBrand = deal.brandId.toString() === userId.toString();
  const isInfluencer = deal.influencerId.toString() === userId.toString();
  if (!isBrand && !isInfluencer) {
    return { error: { status: 403, message: 'Access denied.' } };
  }
  return { deal, isBrand, isInfluencer };
}

// ─────────────────────────────────────────
// SUBMIT / UPDATE PAYOUT DETAILS (influencer)
// ─────────────────────────────────────────
exports.submitPayoutDetails = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { method, accountHolderName, accountNumber, ifscCode, upiId } = req.body;

    const { deal, isInfluencer, error } = await loadDealForParticipant(dealId, req.userId);
    if (error) return res.status(error.status).json({ error: error.message });
    if (!isInfluencer) return res.status(403).json({ error: 'Only the creator on this deal can submit payout details.' });

    if (deal.status === 'cancelled') {
      return res.status(400).json({ error: 'This deal was cancelled.' });
    }
    if (deal.negotiationStatus !== 'agreed') {
      return res.status(400).json({ error: 'Payout details can only be submitted once a price is agreed.' });
    }

    if (!['bank', 'upi'].includes(method)) {
      return res.status(400).json({ error: 'Select a payout method.' });
    }
    if (!accountHolderName || !accountHolderName.trim()) {
      return res.status(400).json({ error: 'Account holder name is required.' });
    }

    if (method === 'bank') {
      if (!ACCOUNT_NUMBER_PATTERN.test(accountNumber || '')) {
        return res.status(400).json({ error: 'Enter a valid account number (9–18 digits).' });
      }
      if (!IFSC_PATTERN.test((ifscCode || '').toUpperCase())) {
        return res.status(400).json({ error: 'Enter a valid IFSC code (e.g. HDFC0001234).' });
      }
    } else {
      if (!UPI_PATTERN.test(upiId || '')) {
        return res.status(400).json({ error: 'Enter a valid UPI ID (e.g. name@bank).' });
      }
    }

    let existing = await PayoutDetail.findOne({ dealId });
    if (existing?.paid) {
      return res.status(400).json({ error: 'This deal is already marked as paid — payout details are locked.' });
    }

    const update = {
      dealId,
      influencerId: deal.influencerId,
      brandId: deal.brandId,
      method,
      accountHolderName: accountHolderName.trim().slice(0, 100),
      accountNumberEnc: method === 'bank' ? encrypt(accountNumber) : '',
      ifscCodeEnc: method === 'bank' ? encrypt(ifscCode.toUpperCase()) : '',
      upiIdEnc: method === 'upi' ? encrypt(upiId) : '',
    };

    const saved = await PayoutDetail.findOneAndUpdate(
      { dealId },
      { $set: update },
      { upsert: true, new: true }
    );

    await postDealNotice({
      dealId: deal._id,
      senderId: req.userId,
      receiverId: deal.brandId,
      content: existing
        ? `💳 ${req.user.name} updated their payout details.`
        : `💳 ${req.user.name} submitted payout details — ready for payment.`,
      actorContent: existing
        ? `💳 You updated your payout details.`
        : `💳 You submitted your payout details — ready for payment.`,
    });

    // Email the brand on first submission (not on later edits — avoid noise).
    if (!existing) {
      const [brand, campaign] = await Promise.all([
        User.findById(deal.brandId).select('email'),
        Campaign.findById(deal.campaignId).select('title'),
      ]);
      if (brand?.email) {
        notify.payoutDetailsSubmittedBrand(brand.email, {
          influencerName: req.user.name,
          campaignTitle: campaign?.title,
        });
      }
    }

    res.status(existing ? 200 : 201).json({ payout: decryptForResponse(saved) });
  } catch (error) {
    console.error('Submit payout details error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET PAYOUT DETAILS (brand or influencer)
// ─────────────────────────────────────────
exports.getPayoutDetails = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { error } = await loadDealForParticipant(dealId, req.userId);
    if (error) return res.status(error.status).json({ error: error.message });

    const payout = await PayoutDetail.findOne({ dealId });
    if (!payout) return res.json({ payout: null });

    res.json({ payout: decryptForResponse(payout) });
  } catch (error) {
    console.error('Get payout details error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// MARK AS PAID (brand)
// ─────────────────────────────────────────
exports.markAsPaid = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { transactionRef, receiptUrl, receiptFileName } = req.body;
    const { deal, isBrand, error } = await loadDealForParticipant(dealId, req.userId);
    if (error) return res.status(error.status).json({ error: error.message });
    if (!isBrand) return res.status(403).json({ error: 'Only the brand on this deal can mark it as paid.' });

    const payout = await PayoutDetail.findOne({ dealId });
    if (!payout) return res.status(400).json({ error: 'No payout details have been submitted for this deal yet.' });
    if (payout.paid) return res.status(400).json({ error: 'Already marked as paid.' });
    if (deal.status !== 'content-submitted') {
      return res.status(400).json({ error: 'The creator must mark the content as submitted before you can mark this deal as paid.' });
    }

    if (!transactionRef || !transactionRef.trim()) {
      return res.status(400).json({ error: 'Enter the transaction ID / UTR number for this payment.' });
    }
    if (!receiptUrl) {
      return res.status(400).json({ error: 'Attach a payment receipt.' });
    }

    payout.paid = true;
    payout.paidAt = new Date();
    payout.paidBy = req.userId;
    payout.transactionRef = transactionRef.trim().slice(0, 100);
    payout.receiptUrl = receiptUrl;
    payout.receiptFileName = (receiptFileName || '').slice(0, 200);
    await payout.save();

    await postDealNotice({
      dealId: deal._id,
      senderId: req.userId,
      receiverId: deal.influencerId,
      content: `✅ ${req.user.name} marked this deal as paid.`,
      actorContent: `✅ You marked this deal as paid.`,
    });

    const [influencer, campaign] = await Promise.all([
      User.findById(deal.influencerId).select('email'),
      Campaign.findById(deal.campaignId).select('title'),
    ]);
    if (influencer?.email) {
      notify.paymentCompletedInfluencer(influencer.email, {
        campaignTitle: campaign?.title,
        brandName: req.user.name,
        amount: deal.agreedAmount,
        transactionRef: payout.transactionRef,
      });
    }

    res.json({ payout: decryptForResponse(payout) });
  } catch (error) {
    console.error('Mark payout paid error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

exports.decryptForResponse = decryptForResponse;
