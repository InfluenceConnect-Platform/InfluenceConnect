const crypto = require('crypto');
const User = require('../models/User');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const OTP = require('../models/OTP');
const ProfileView = require('../models/ProfileView');
const StatsSnapshot = require('../models/StatsSnapshot');
const PayoutDetail = require('../models/PayoutDetail');
const Campaign = require('../models/Campaign');
const Application = require('../models/Application');
const Invitation = require('../models/Invitation');
const Deal = require('../models/Deal');
const Message = require('../models/Message');
const notify = require('../services/email');
const { getAdminEmails } = require('./getAdminEmails');

// Run once per cron invocation so a single slow batch can't run away —
// anything left over is picked up on the next daily run.
const BATCH_LIMIT = 50;

// ─────────────────────────────────────────
// Finds every account whose 30-day grace period has passed and permanently
// anonymizes it. Called by the daily cron (see controllers/auth.controller.js
// purgeScheduledDeletions).
//
// Design: the User document is NEVER deleted — Deals, Applications,
// Messages, Payments, and Subscriptions all reference this id, and the
// other party in each of those needs their own record of the collaboration
// to keep working. Instead every PII field on the User doc is scrubbed and
// login is permanently blocked. Data that belongs exclusively to this user
// (profile, payout bank details, OTPs, analytics) is hard-deleted. Anything
// that could still turn into a brand-new deal with a now-deleted account
// (open campaigns, pending applications/invitations) is auto-closed.
// ─────────────────────────────────────────
async function purgeDueAccounts() {
  const due = await User.find({
    deleteScheduledAt: { $ne: null, $lte: new Date() },
    deletedAt: null,
  }).limit(BATCH_LIMIT);

  const result = { purged: 0, errored: 0 };

  for (const user of due) {
    try {
      await purgeOneAccount(user);
      result.purged++;
    } catch (err) {
      console.error(`[purgeDueAccounts] failed for user ${user._id}:`, err);
      result.errored++;
    }
  }

  return result;
}

async function purgeOneAccount(user) {
  const userId = user._id;
  const role = user.role;
  const originalEmail = user.email;
  const originalName = user.name;

  // Stop any live recurring billing before touching anything else — a
  // deleted account must never be charged again. cancelForUser resolves
  // (doesn't throw) when there's simply no active subscription to cancel.
  try {
    // Required lazily to avoid a require-cycle with subscription.controller,
    // which itself pulls in models this file also uses.
    const { cancelForUser } = require('../controllers/subscription.controller');
    await cancelForUser(userId, { immediate: true, reason: 'Account deleted' });
  } catch (err) {
    console.error(`[purgeOneAccount] subscription cancel failed for ${userId}:`, err.message);
  }

  // Auto-close anything that could still turn into a brand-new deal with a
  // now-deleted account.
  if (role === 'brand') {
    await Campaign.updateMany(
      { brandId: userId, status: { $in: ['draft', 'active', 'in-progress'] } },
      { $set: { status: 'closed' } }
    );
  }
  await Application.updateMany(
    { $or: [{ influencerId: userId }, { brandId: userId }], status: { $in: ['applied', 'shortlisted', 'on-hold'] } },
    { $set: { status: 'rejected', statusUpdatedAt: new Date() } }
  );
  await Invitation.updateMany(
    { $or: [{ influencerId: userId }, { brandId: userId }], status: 'pending' },
    { $set: { status: 'rejected', respondedAt: new Date() } }
  );

  // Deals: 'in-progress' has no work pending review yet, so it's safe to
  // auto-cancel (mirrors the same call the admin "remove campaign" flow
  // makes) — post a system notice in the chat and email the surviving
  // party. 'content-submitted' deals may have real, unpaid work sitting in
  // review; per the same precedent as removeCampaign, those are left alone
  // rather than unwound, and instead flagged to admins for manual follow-up.
  const involvingUser = { $or: [{ influencerId: userId }, { brandId: userId }] };

  const inProgressDeals = await Deal.find({ ...involvingUser, status: 'in-progress' });
  for (const deal of inProgressDeals) {
    deal.status = 'cancelled';
    await deal.save();

    const otherPartyId = deal.brandId.toString() === userId.toString() ? deal.influencerId : deal.brandId;
    const otherPartyRole = deal.brandId.toString() === userId.toString() ? 'influencer' : 'brand';

    // Mirrors the system-notice shape the admin "remove campaign" cancellation
    // flow uses (brandId as sender, influencerId as receiver) — arbitrary
    // direction for a system message, kept consistent with that precedent.
    await Message.create({
      dealId: deal._id,
      senderId: deal.brandId,
      receiverId: deal.influencerId,
      content: '⚠️ The other party on this deal deleted their account, so this collaboration has been cancelled. If you have any further queries, please contact our support.',
      system: true,
    });

    const otherParty = await User.findById(otherPartyId).select('name email');
    if (otherParty?.email) {
      notify.dealCancelledAccountDeleted(otherParty.email, {
        name: otherParty.name,
        role: otherPartyRole,
        dealCustomId: deal.customId,
      });
    }
  }

  const contentSubmittedDeals = await Deal.find({ ...involvingUser, status: 'content-submitted' });
  if (contentSubmittedDeals.length > 0) {
    const adminEmails = await getAdminEmails();
    for (const deal of contentSubmittedDeals) {
      const campaign = await Campaign.findById(deal.campaignId).select('title');
      notify.dealNeedsAdminReviewAccountDeleted(adminEmails, {
        dealCustomId: deal.customId,
        campaignTitle: campaign?.title,
        deletedRole: role,
      });
    }
  }

  // Hard-delete data that belongs exclusively to this user and carries no
  // meaning for anyone else once they're gone.
  if (role === 'influencer') {
    const profile = await InfluencerProfile.findOneAndDelete({ userId });
    if (profile) {
      await ProfileView.deleteMany({ profileId: profile._id });
    }
    await StatsSnapshot.deleteMany({ userId });
  } else if (role === 'brand') {
    await BrandProfile.findOneAndDelete({ userId });
    await ProfileView.deleteMany({ brandId: userId });
  }
  await OTP.deleteMany({ userId });

  // Scrub bank/UPI details on payout submissions where this user was the
  // influencer. The record and the brand's paid/transactionRef history must
  // survive (it's their proof of payment), but the influencer's financial
  // identity should not.
  await PayoutDetail.updateMany(
    { influencerId: userId },
    { $set: { accountHolderName: '', accountNumberEnc: '', ifscCodeEnc: '', upiIdEnc: '' } }
  );

  // Final notice to the real inbox before the address is wiped.
  await notify.accountDeletionCompleted(originalEmail, { name: originalName, role });

  // Anonymize the User document in place (see the module comment above for
  // why it's never actually deleted).
  user.name = 'Deleted User';
  user.email = `deleted-${userId}@deleted.influenceconnect.invalid`;
  user.mobile = `deleted-${userId}`;
  user.pendingMobile = null;
  user.password = crypto.randomBytes(32).toString('hex'); // unusable; hashed by the pre-save hook
  user.googleId = null;
  user.status = 'suspended'; // permanently blocks login (see login's deletedAt check, which fires first)
  user.deleteScheduledAt = null;
  user.deletedAt = new Date();
  await user.save();
}

module.exports = { purgeDueAccounts };
