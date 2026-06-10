const { Resend } = require('resend');

// ─────────────────────────────────────────────────────────────
// Low-level email sender.
//
// This is the single choke point through which every transactional
// email flows. It is intentionally inert until EMAILS_ENABLED=true so the
// trigger points across the app can be wired up now and start delivering the
// moment Resend is configured for production — no code changes needed, just
// the env flag.
//
// It NEVER throws: a failed/disabled email must never break the request that
// triggered it (a signup, an application, a message…). Failures are logged.
// ─────────────────────────────────────────────────────────────

const ENABLED = process.env.EMAILS_ENABLED === 'true';
const FROM = process.env.EMAIL_FROM || 'Influence Connect <onboarding@resend.dev>';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendEmail({ to, subject, html }) {
  if (!to || !subject || !html) return;

  // Dev bypass: Resend's test sender only delivers to the account owner, so in
  // dev we redirect every recipient to one inbox and tag the real target.
  const bypass = process.env.DEV_OTP_EMAIL;
  const recipient = bypass || to;
  const finalSubject = bypass ? `[DEV→${to}] ${subject}` : subject;

  if (!ENABLED || !resend) {
    console.log(`[EMAIL:skipped] to=${to} subject="${subject}" (set EMAILS_ENABLED=true to send)`);
    return;
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to: recipient, subject: finalSubject, html });
    if (error) console.error(`[EMAIL:error] subject="${subject}"`, error);
    else console.log(`[EMAIL:sent] to=${recipient} subject="${subject}"`);
  } catch (err) {
    console.error(`[EMAIL:exception] subject="${subject}"`, err.message);
  }
}

module.exports = { sendEmail };
