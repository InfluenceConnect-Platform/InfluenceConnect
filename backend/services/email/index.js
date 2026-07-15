const { sendEmail } = require('./mailer');
const templates = require('./templates');

// ─────────────────────────────────────────────────────────────
// notify — the public API controllers use to fire transactional emails.
//
//   const notify = require('../services/email');
//   notify.applicationAccepted(influencer.email, { campaignTitle, brandName, amount });
//
// Each method is fire-and-forget and self-contained: it builds the template,
// targets the recipient, and delegates to the inert-until-enabled sender.
// Nothing here throws, so a missing recipient or template error can never break
// the request that triggered the email.
// ─────────────────────────────────────────────────────────────

function make(type) {
  return async (to, data = {}) => {
    try {
      if (!to || typeof templates[type] !== 'function') return;
      const { subject, html } = templates[type](data);
      await sendEmail({ to, subject, html });
    } catch (err) {
      console.error(`[EMAIL:notify:${type}] failed to build/send`, err.message);
    }
  };
}

module.exports = {
  // 2  — account activated
  welcome:                make('welcome'),
  // 3  — influencer: application submitted
  applicationSubmitted:   make('applicationSubmitted'),
  // 4  — influencer: shortlisted
  applicationShortlisted: make('applicationShortlisted'),
  // 5  — influencer: accepted, deal created
  applicationAccepted:    make('applicationAccepted'),
  // 6  — influencer: rejected
  applicationRejected:    make('applicationRejected'),
  // 7  — influencer: new message
  newMessageToInfluencer: make('newMessageToInfluencer'),
  // 8  — influencer: deal completed
  dealCompletedInfluencer: make('dealCompletedInfluencer'),
  // 9  — brand: new application received
  newApplicationToBrand:  make('newApplicationToBrand'),
  // 10 — brand: new message
  newMessageToBrand:      make('newMessageToBrand'),
  // 11 — brand: deal in progress
  dealInProgressBrand:    make('dealInProgressBrand'),
  // 12 — brand: content submitted
  contentSubmittedBrand:  make('contentSubmittedBrand'),
  // both parties: new/countered price offer submitted
  offerMadeInfluencer:         make('offerMadeInfluencer'),
  offerMadeBrand:              make('offerMadeBrand'),
  // both parties: offer accepted, price agreed
  priceAgreedInfluencer:       make('priceAgreedInfluencer'),
  priceAgreedBrand:            make('priceAgreedBrand'),
  // brand: payout details submitted by creator
  payoutDetailsSubmittedBrand: make('payoutDetailsSubmittedBrand'),
  // influencer: confirmation receipt of their own payout submission/update
  payoutDetailsConfirmInfluencer: make('payoutDetailsConfirmInfluencer'),
  // brand: creator changed payout details after first submission
  payoutDetailsUpdatedBrand:   make('payoutDetailsUpdatedBrand'),
  // influencer: payment marked complete by brand
  paymentCompletedInfluencer:  make('paymentCompletedInfluencer'),
  // brand: record/confirmation of the payment they just marked
  paymentRecordedBrand:        make('paymentRecordedBrand'),

  // Campaign + invitations
  newCampaignToInfluencer:   make('newCampaignToInfluencer'),
  invitationReceived:        make('invitationReceived'),
  invitationSentBrand:       make('invitationSentBrand'),
  invitationDeclinedBrand:   make('invitationDeclinedBrand'),
  invitationAccepted:        make('invitationAccepted'),
  invitationAcceptedBrand:   make('invitationAcceptedBrand'),

  // Account lifecycle
  accountDeletionScheduled:  make('accountDeletionScheduled'),
  accountDeletionCancelled:  make('accountDeletionCancelled'),

  // Admin actions
  accountSuspended:          make('accountSuspended'),
  accountRestored:           make('accountRestored'),
  gstinSubmitted:            make('gstinSubmitted'),
  gstinSubmittedAdmin:       make('gstinSubmittedAdmin'),
  gstinApproved:             make('gstinApproved'),
  gstinRejected:             make('gstinRejected'),
  gstinResubmitRequested:    make('gstinResubmitRequested'),
  campaignRemovedBrand:      make('campaignRemovedBrand'),
  campaignRemovedInfluencer: make('campaignRemovedInfluencer'),
};
