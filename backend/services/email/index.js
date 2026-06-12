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
  gstinApproved:             make('gstinApproved'),
  gstinRejected:             make('gstinRejected'),
  gstinResubmitRequested:    make('gstinResubmitRequested'),
  campaignRemovedBrand:      make('campaignRemovedBrand'),
  campaignRemovedInfluencer: make('campaignRemovedInfluencer'),
};
