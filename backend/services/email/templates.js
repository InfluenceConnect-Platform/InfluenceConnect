// ─────────────────────────────────────────────────────────────
// Email content. Each builder returns { subject, html } for one
// notification type. They take plain data (no DB access) so they stay easy to
// preview and test. Shared branded layout matches the OTP email style.
// ─────────────────────────────────────────────────────────────

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

function para(text) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.65;">${text}</p>`;
}

// A compact key/value detail block (campaign, brand, amount…).
function details(rows) {
  const items = rows
    .filter((r) => r && r[1] !== undefined && r[1] !== null && r[1] !== '')
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#9ca3af;width:130px;vertical-align:top;">${esc(label)}</td>
          <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${esc(value)}</td>
        </tr>`
    )
    .join('');
  if (!items) return '';
  return `<table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb;border:1px solid #f0f1f3;border-radius:12px;padding:8px 18px;margin:0 0 24px;">${items}</table>`;
}

function button(label, url) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:4px 0 28px;"><tr>
      <td style="border-radius:10px;background:linear-gradient(135deg,#3D5087,#5D8A8F);">
        <a href="${url}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(label)} →</a>
      </td>
    </tr></table>`;
}

function layout({ heading, bodyHtml }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#7FA8AD,#5D8A8F,#3D5087);"></td></tr>
        <tr><td style="padding:36px 40px 32px;">
          <div style="margin-bottom:28px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#7FA8AD,#3D5087);text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-weight:700;font-size:12px;line-height:32px;">IC</span>
              </td>
              <td style="padding-left:10px;vertical-align:middle;">
                <span style="font-weight:600;font-size:14px;color:#374151;">Influence Connect</span>
              </td>
            </tr></table>
          </div>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">${heading}</h1>
          ${bodyHtml}
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:8px 0 20px;">
          <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center;">© ${new Date().getFullYear()} Influence Connect · India</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = {
  // 2 — Welcome (account activated)
  welcome({ name, role }) {
    const isBrand = role === 'brand';
    const url = `${APP_URL}/${isBrand ? 'brand' : 'influencer'}/dashboard`;
    return {
      subject: 'Welcome to Influence Connect 🎉',
      html: layout({
        heading: `Welcome aboard, ${esc(name || 'there')}!`,
        bodyHtml:
          para('Your email and mobile are verified and your account is now active.') +
          para(
            isBrand
              ? 'Next up: create your first campaign and start discovering creators who fit your brand.'
              : 'Next up: complete your profile and start applying to campaigns that match your niche.'
          ) +
          button('Go to dashboard', url),
      }),
    };
  },

  // 3 — Application submitted (to influencer)
  applicationSubmitted({ campaignTitle, brandName }) {
    return {
      subject: `Application submitted — ${campaignTitle}`,
      html: layout({
        heading: 'Your application is in 🚀',
        bodyHtml:
          para(`We've submitted your application. ${esc(brandName || 'The brand')} will review it soon.`) +
          details([['Campaign', campaignTitle], ['Brand', brandName]]) +
          button('View my applications', `${APP_URL}/influencer/campaigns`),
      }),
    };
  },

  // 4 — Application shortlisted (to influencer)
  applicationShortlisted({ campaignTitle, brandName }) {
    return {
      subject: `You've been shortlisted — ${campaignTitle}`,
      html: layout({
        heading: "You're shortlisted! ✨",
        bodyHtml:
          para(`${esc(brandName || 'The brand')} shortlisted your application for <strong>${esc(campaignTitle)}</strong>.`) +
          para('Keep an eye on your inbox — they may reach out or accept your application next.') +
          details([['Campaign', campaignTitle], ['Brand', brandName]]) +
          button('View my applications', `${APP_URL}/influencer/campaigns`),
      }),
    };
  },

  // 5 — Application accepted, deal created (to influencer)
  applicationAccepted({ campaignTitle, brandName, amount }) {
    return {
      subject: `Congratulations! You're booked — ${campaignTitle}`,
      html: layout({
        heading: 'Your application was accepted 🎉',
        bodyHtml:
          para(`Great news — ${esc(brandName || 'the brand')} accepted your application and a deal has been created.`) +
          details([['Campaign', campaignTitle], ['Brand', brandName], ['Agreed amount', inr(amount)]]) +
          para('Head to your messages to coordinate deliverables and timelines with the brand.') +
          button('Open messages', `${APP_URL}/influencer/messages`),
      }),
    };
  },

  // 6 — Application rejected (to influencer)
  applicationRejected({ campaignTitle, brandName }) {
    return {
      subject: `Update on your application — ${campaignTitle}`,
      html: layout({
        heading: 'An update on your application',
        bodyHtml:
          para(`Thanks for applying to <strong>${esc(campaignTitle)}</strong>${brandName ? ` by ${esc(brandName)}` : ''}. Unfortunately the brand has decided to move forward with other creators this time.`) +
          para("Don't be discouraged — new campaigns are posted regularly, and the right fit is out there. Browse what's live now:") +
          button('Browse campaigns', `${APP_URL}/influencer/campaigns`),
      }),
    };
  },

  // 7 — New message (to influencer)
  newMessageToInfluencer({ fromName, preview }) {
    return {
      subject: `New message from ${fromName || 'a brand'}`,
      html: layout({
        heading: `${esc(fromName || 'A brand')} sent you a message`,
        bodyHtml:
          (preview ? para(`<em style="color:#6b7280;">"${esc(preview)}"</em>`) : para('You have a new message in one of your active deals.')) +
          button('Open messages', `${APP_URL}/influencer/messages`),
      }),
    };
  },

  // 8 — Deal completed (to influencer)
  dealCompletedInfluencer({ campaignTitle, amount, totalEarnings }) {
    return {
      subject: `Deal completed — ${campaignTitle}`,
      html: layout({
        heading: 'Deal completed — nice work! 🏆',
        bodyHtml:
          para(`Your deal for <strong>${esc(campaignTitle)}</strong> has been marked complete by the brand.`) +
          details([
            ['Campaign', campaignTitle],
            ['Final amount', inr(amount)],
            ['Total earnings', inr(totalEarnings)],
          ]) +
          button('View earnings', `${APP_URL}/influencer/earnings`),
      }),
    };
  },

  // 9 — New application received (to brand)
  newApplicationToBrand({ influencerName, campaignTitle }) {
    return {
      subject: `New application — ${campaignTitle}`,
      html: layout({
        heading: 'You have a new applicant 📥',
        bodyHtml:
          para(`${esc(influencerName || 'A creator')} just applied to <strong>${esc(campaignTitle)}</strong>.`) +
          details([['Creator', influencerName], ['Campaign', campaignTitle]]) +
          button('Review applications', `${APP_URL}/brand/campaigns`),
      }),
    };
  },

  // 10 — New message (to brand)
  newMessageToBrand({ fromName, preview }) {
    return {
      subject: `New message from ${fromName || 'a creator'}`,
      html: layout({
        heading: `${esc(fromName || 'A creator')} sent you a message`,
        bodyHtml:
          (preview ? para(`<em style="color:#6b7280;">"${esc(preview)}"</em>`) : para('You have a new message in one of your active deals.')) +
          button('Open messages', `${APP_URL}/brand/messages`),
      }),
    };
  },

  // 11 — Deal in progress confirmation (to brand)
  dealInProgressBrand({ influencerName, campaignTitle, amount }) {
    return {
      subject: `Deal started with ${influencerName || 'a creator'} — ${campaignTitle}`,
      html: layout({
        heading: 'Your deal is in progress 🤝',
        bodyHtml:
          para(`You accepted ${esc(influencerName || 'a creator')} for <strong>${esc(campaignTitle)}</strong> and a deal is now active.`) +
          details([['Creator', influencerName], ['Campaign', campaignTitle], ['Agreed amount', inr(amount)]]) +
          para('Use messages to align on deliverables and timelines. Once the creator submits content, you can review and complete the deal.') +
          button('Open messages', `${APP_URL}/brand/messages`),
      }),
    };
  },

  // 12 — Content submitted by influencer (to brand)
  contentSubmittedBrand({ influencerName, campaignTitle }) {
    return {
      subject: `Content submitted — ${campaignTitle}`,
      html: layout({
        heading: 'Content is ready for review 📝',
        bodyHtml:
          para(`${esc(influencerName || 'The creator')} submitted content for <strong>${esc(campaignTitle)}</strong>.`) +
          details([['Creator', influencerName], ['Campaign', campaignTitle]]) +
          para('Please review the deliverables and mark the deal complete once you\'re satisfied.') +
          button('Review & approve', `${APP_URL}/brand/messages`),
      }),
    };
  },

  // New campaign published (to a matching influencer)
  newCampaignToInfluencer({ campaignTitle, brandName, budgetMin, budgetMax, niche }) {
    const budget = budgetMin || budgetMax ? `${inr(budgetMin)} – ${inr(budgetMax)}` : 'Open';
    const nicheList = Array.isArray(niche) && niche.length ? niche.join(', ') : null;
    return {
      subject: `New campaign you might like — ${campaignTitle}`,
      html: layout({
        heading: 'A new campaign just went live 🔔',
        bodyHtml:
          para(`${esc(brandName || 'A brand')} posted a new campaign that fits your profile. Apply early to stand out.`) +
          details([['Campaign', campaignTitle], ['Brand', brandName], ['Budget', budget], ['Niche', nicheList]]) +
          button('View campaign', `${APP_URL}/influencer/campaigns`),
      }),
    };
  },

  // Invitation received (to influencer)
  invitationReceived({ campaignTitle, brandName, message }) {
    return {
      subject: `${brandName || 'A brand'} invited you to a campaign`,
      html: layout({
        heading: "You've got an invitation ✉️",
        bodyHtml:
          para(`${esc(brandName || 'A brand')} personally invited you to collaborate on <strong>${esc(campaignTitle)}</strong>.`) +
          (message ? para(`<em style="color:#6b7280;">"${esc(message)}"</em>`) : '') +
          details([['Campaign', campaignTitle], ['Brand', brandName]]) +
          button('View invitation', `${APP_URL}/influencer/invitations`),
      }),
    };
  },

  // Invitation(s) sent confirmation (to brand)
  invitationSentBrand({ campaignTitle, count }) {
    const n = count || 1;
    return {
      subject: `Invitation${n > 1 ? 's' : ''} sent — ${campaignTitle}`,
      html: layout({
        heading: `Invitation${n > 1 ? 's' : ''} sent 📨`,
        bodyHtml:
          para(`You invited ${n} creator${n > 1 ? 's' : ''} to <strong>${esc(campaignTitle)}</strong>. We'll let you know as soon as they respond.`) +
          button('View invitations', `${APP_URL}/brand/invitations`),
      }),
    };
  },

  // Invitation declined (to brand)
  invitationDeclinedBrand({ campaignTitle, influencerName }) {
    return {
      subject: `Invitation declined — ${campaignTitle}`,
      html: layout({
        heading: 'An invitation was declined',
        bodyHtml:
          para(`${esc(influencerName || 'A creator')} declined your invitation to <strong>${esc(campaignTitle)}</strong>.`) +
          para('No worries — you can invite other creators from Discover.') +
          button('Discover creators', `${APP_URL}/brand/discover`),
      }),
    };
  },

  // Account deletion scheduled (to user)
  accountDeletionScheduled({ name, deleteAt }) {
    const when = deleteAt
      ? new Date(deleteAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'in 30 days';
    return {
      subject: 'Your account is scheduled for deletion',
      html: layout({
        heading: 'Account deletion scheduled',
        bodyHtml:
          para(`Hi ${esc(name || 'there')}, we've scheduled your Influence Connect account for permanent deletion on <strong>${esc(when)}</strong>.`) +
          para('Changed your mind? You can cancel anytime before then from your account settings — no data is lost until the deletion date.') +
          button('Keep my account', `${APP_URL}/`),
      }),
    };
  },

  // Account deletion cancelled (to user)
  accountDeletionCancelled({ name }) {
    return {
      subject: 'Your account deletion has been cancelled',
      html: layout({
        heading: 'Your account is safe ✅',
        bodyHtml:
          para(`Hi ${esc(name || 'there')}, your scheduled account deletion has been cancelled and your account will stay active. Welcome back!`),
      }),
    };
  },

  // ── Admin actions (account / verification / moderation) ──

  // Account suspended by admin (to user)
  accountSuspended({ name }) {
    return {
      subject: 'Your Influence Connect account has been suspended',
      html: layout({
        heading: 'Your account has been suspended',
        bodyHtml:
          para(`Hi ${esc(name || 'there')}, your Influence Connect account has been suspended by our team and access is temporarily disabled.`) +
          para('If you believe this was a mistake or would like to appeal, reply to this email and our support team will help.'),
      }),
    };
  },

  // Account restored by admin (to user)
  accountRestored({ name, role }) {
    const url = `${APP_URL}/${role === 'brand' ? 'brand' : 'influencer'}/dashboard`;
    return {
      subject: 'Your Influence Connect account has been restored',
      html: layout({
        heading: 'Welcome back — your account is active again ✅',
        bodyHtml:
          para(`Hi ${esc(name || 'there')}, good news — your account has been restored and you have full access again.`) +
          button('Go to dashboard', url),
      }),
    };
  },

  // GSTIN verified by admin (to brand)
  gstinApproved({ companyName }) {
    return {
      subject: 'Your GSTIN has been verified ✅',
      html: layout({
        heading: 'GSTIN verified',
        bodyHtml:
          para(`Good news${companyName ? `, ${esc(companyName)}` : ''} — your GSTIN has been verified and your brand is now fully verified on Influence Connect.`) +
          button('Go to dashboard', `${APP_URL}/brand/dashboard`),
      }),
    };
  },

  // GSTIN rejected by admin (to brand)
  gstinRejected({ companyName }) {
    return {
      subject: 'Action needed: your GSTIN could not be verified',
      html: layout({
        heading: 'GSTIN verification unsuccessful',
        bodyHtml:
          para(`We couldn't verify the GSTIN on your account${companyName ? `, ${esc(companyName)}` : ''}. Please double-check the number and resubmit it from your profile.`) +
          button('Update GSTIN', `${APP_URL}/brand/profile`),
      }),
    };
  },

  // Campaign removed by admin (to brand owner)
  campaignRemovedBrand({ campaignTitle }) {
    return {
      subject: `Your campaign was removed — ${campaignTitle}`,
      html: layout({
        heading: 'A campaign was removed',
        bodyHtml:
          para(`Your campaign <strong>${esc(campaignTitle)}</strong> has been removed by our moderation team and is no longer live.`) +
          para('If you have questions about this decision, reply to this email and our support team will help.'),
      }),
    };
  },

  // Campaign removed by admin (to an influencer whose active deal was cancelled)
  campaignRemovedInfluencer({ campaignTitle, brandName }) {
    return {
      subject: `Collaboration cancelled — ${campaignTitle}`,
      html: layout({
        heading: 'A collaboration was cancelled',
        bodyHtml:
          para(`The campaign <strong>${esc(campaignTitle)}</strong>${brandName ? ` by ${esc(brandName)}` : ''} was removed by our moderation team, so your active collaboration has been cancelled. No further action is needed.`) +
          button('Browse campaigns', `${APP_URL}/influencer/campaigns`),
      }),
    };
  },
};
