const User = require('../models/User');
const OTP = require('../models/OTP');
const BrandProfile = require('../models/BrandProfile');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const notify = require('../services/email');
const logAdminAction = require('../utils/logAdminAction');
const { isValidGstin, normalizeGstin } = require('../utils/validateGstin');
const { getAdminEmails } = require('../utils/getAdminEmails');
const applyPremiumUpgrade = require('../utils/applyPremiumUpgrade');
const { verifyTurnstileToken } = require('../utils/verifyTurnstile');
const { themeFor } = require('../services/email/templates');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Influence Connect <onboarding@resend.dev>';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Indian mobile numbers, +91 followed by 10 digits starting 6-9 (matches sendMobileOtp below).
const MOBILE_REGEX = /^\+91[6-9]\d{9}$/;

// Generate 6 digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Max wrong guesses before a code is burned. A 6-digit OTP is only 1,000,000
// combinations, so without this an attacker could brute-force it (especially on
// the password-reset flow) within the 10-minute window.
const MAX_OTP_ATTEMPTS = 5;

const MAX_LOGIN_ATTEMPTS = 10;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Record a failed OTP guess and invalidate the code once the limit is reached.
// Returns true if the code is now locked, so the caller can adjust its message.
async function registerFailedOtpAttempt(otpRecord) {
  otpRecord.attempts = (otpRecord.attempts || 0) + 1;
  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    otpRecord.used = true; // burn the code so further guesses are useless
  }
  await otpRecord.save();
  return otpRecord.used;
}

// True when `user` is a signup that was started but never finished — the
// verification email/SMS went out, but nobody ever entered a correct code
// (app closed, code expired, connection dropped). Its email/mobile are still
// unproven, so the account is just a "reservation" rather than something
// someone actually owns yet, and register() below is free to clear it out
// and let a fresh attempt through instead of permanently blocking that
// address. `status` stays 'pending' until OTP verification finishes it off —
// see tryActivateUser — so it alone is enough to detect this for both roles.
// Google signups are excluded: they don't go through this endpoint at all, so
// a 'pending' Google account here means a *different* email/password signup
// is colliding with an already-Google-registered address, which should still
// be blocked (they need to use "Continue with Google" instead).
function isReclaimableSignup(user) {
  return user.status === 'pending' && user.signupMethod !== 'google';
}

// Deletes an abandoned signup and everything created alongside it (its unused
// OTPs, and its BrandProfile stub if it was a brand) so a retry with the same
// email/mobile starts completely clean rather than colliding with orphaned
// data.
async function purgeAbandonedSignup(userId) {
  await OTP.deleteMany({ userId });
  await BrandProfile.deleteOne({ userId });
  await User.deleteOne({ _id: userId });
}

// Professional email OTP template — themed by role (brand green / creator
// ruby) to match the rest of the transactional emails in services/email, so
// it never drifts back to its own one-off palette.
function buildOtpEmail({ role, heading, body, otp, codeLabel, devNote, warning = true, footerNote }) {
  const theme = themeFor(role);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Top accent bar -->
        <tr><td style="height:4px;background:${theme.bar};"></td></tr>

        <tr><td style="padding:36px 40px 32px;">

          <!-- Logo -->
          <div style="margin-bottom:28px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:32px;height:32px;border-radius:8px;background:${theme.logo};text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-weight:700;font-size:12px;line-height:32px;">IC</span>
              </td>
              <td style="padding-left:10px;vertical-align:middle;">
                <span style="font-weight:600;font-size:14px;color:#374151;">Influence Connect</span>
              </td>
            </tr></table>
          </div>

          ${devNote ? `<p style="color:#92400e;font-size:11px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;margin:0 0 20px;">${devNote}</p>` : ''}

          <!-- Heading -->
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${heading}</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">${body}</p>

          <!-- OTP box -->
          <div style="text-align:center;background:${theme.tint};border:1px solid ${theme.tintBorder};border-radius:12px;padding:28px 20px;margin-bottom:28px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${theme.accent};">${codeLabel}</p>
            <p style="margin:0;font-size:38px;font-weight:800;letter-spacing:10px;color:${theme.accent};font-family:'Courier New',monospace;">${otp}</p>
            <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">Expires in 10 minutes</p>
          </div>

          ${warning ? `<!-- Warning -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
            <tr>
              <td width="4" style="background:${theme.bar};border-radius:4px;">&nbsp;</td>
              <td style="padding:10px 14px;">
                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                  Never share this code with anyone. Influence Connect will <strong>never</strong> ask for your OTP.
                </p>
              </td>
            </tr>
          </table>` : ''}

          ${footerNote ? `<p style="margin:0 0 24px;font-size:13px;color:#9ca3af;line-height:1.6;">${footerNote}</p>` : ''}

          <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;">
          <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center;">
            © ${new Date().getFullYear()} Influence Connect · India
          </p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Generate JWT token
function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password, gstin, turnstileToken } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Bot protection: the client widget hands back a one-time token that we
    // must redeem with Cloudflare before trusting anything else in the form.
    const isHuman = await verifyTurnstileToken(turnstileToken, req.ip);
    if (!isHuman) {
      return res.status(400).json({ error: 'Bot verification failed. Please refresh and try again.' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!MOBILE_REGEX.test(mobile)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // SECURITY: never trust a client-supplied role. Self-service signup may only
    // create 'brand' or 'influencer' accounts — admins are provisioned manually.
    // Without this, anyone could register with role:'admin' and gain full
    // admin access after verifying the OTP on their own email.
    const role = req.body.role === 'brand' ? 'brand' : 'influencer';

    // Brands must submit a valid GSTIN at signup — it's the basis for the
    // manual verification flow that follows.
    let normalizedGstin = '';
    if (role === 'brand') {
      normalizedGstin = normalizeGstin(gstin);
      if (!normalizedGstin) {
        return res.status(400).json({ error: 'GST number is required to register as a brand.' });
      }
      if (!isValidGstin(normalizedGstin)) {
        return res.status(400).json({ error: 'Please enter a valid 15-character GST number.' });
      }
    }

    // The email schema path lowercases on save, but a plain findOne() filter
    // doesn't get that same cast — without normalizing here, "Test@x.com"
    // then "test@x.com" would both sail past this check and collide on the
    // DB's unique index instead, surfacing as a raw 500.
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists && !isReclaimableSignup(emailExists)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if mobile already exists
    const mobileExists = await User.findOne({ mobile });
    if (mobileExists && !isReclaimableSignup(mobileExists)) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    // Either or both belong to a signup that was started but never
    // OTP-verified (app closed, code expired, network died mid-flow — see
    // isReclaimableSignup) — clear it out so this attempt isn't blocked by a
    // "reservation" nobody ever proved they own. If the two lookups above
    // found the same abandoned account (its own email + mobile both match),
    // this still only deletes it once.
    const staleIds = new Set(
      [emailExists, mobileExists].filter(Boolean).map((u) => u._id.toString())
    );
    for (const id of staleIds) {
      await purgeAbandonedSignup(id);
    }

    // Create user (password gets hashed automatically via pre-save hook)
    const user = await User.create({
      name,
      email: normalizedEmail,
      mobile,
      password,
      role
    });

    // Brand signup → create the profile up front with the submitted GSTIN
    // queued for admin review. The "GSTIN is being verified" acknowledgement is
    // NOT sent here — it goes out only once the account is fully verified and
    // active (see verifyOTP), so an abandoned signup never receives it.
    if (role === 'brand') {
      await BrandProfile.create({
        userId: user._id,
        gstin: normalizedGstin,
        gstinStatus: 'pending',
        gstinVerified: false,
      });
    }

    // Generate the email OTP only. Mobile verification is now its own step,
    // shown only after the email is confirmed (and for brands it's optional
    // altogether — see verifyOTP), so its code is sent on-demand from that
    // step via /resend-otp rather than pre-emptively here.
    const emailOTP = generateOTP();
    await OTP.create({ userId: user._id, type: 'email', otp: emailOTP });

    // In dev, redirect all OTPs to the bypass inbox; in prod, send to the real address
    const devBypass = process.env.DEV_OTP_EMAIL;
    const emailRecipient = devBypass || email;

    // Send email OTP via Resend
    const { error: emailError } = await resend.emails.send({
      from: FROM,
      to: emailRecipient,
      subject: devBypass
        ? `[DEV] OTP for ${email} — Influence Connect`
        : 'Verify your Influence Connect account',
      html: buildOtpEmail({
        role,
        heading: 'Verify your email address',
        body: `Welcome to Influence Connect! Use the code below to confirm your email address and activate your account.`,
        otp: emailOTP,
        codeLabel: 'Email verification code',
        devNote: devBypass ? `DEV BYPASS — original recipient: ${email}` : null
      })
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      userId: user._id
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// Activates a fully-verified account. Mobile verification is mandatory for
// influencers but optional for brands (the client's call — a brand only has
// to prove its email + GSTIN; mobile can be verified later from account
// settings), so the two roles reach "activatable" via different conditions.
// Called from verifyOTP after either leg is confirmed; a no-op
// (activated: false) if the account isn't eligible yet, or is already active
// — so it's safe to call again e.g. when a brand verifies mobile after
// already being activated on email alone.
//
// Deliberately does NOT send the welcome/GSTIN emails — for an influencer
// this moment and "finished signing up" are the same thing (mobile is their
// last, mandatory step), but for a brand activation can happen a full page
// before that (email alone), with mobile still pending a skip-or-verify
// decision. See sendActivationNotifications, called separately once the flow
// actually finishes for the account's role.
async function tryActivateUser(user) {
  if (user.status === 'active') return { activated: false };
  if (!user.emailVerified) return { activated: false };

  const mobileRequired = user.role !== 'brand';
  if (mobileRequired && !user.mobileVerified) return { activated: false };

  // SECURITY: a brand account may never become active without a GSTIN on
  // file. The standard email and Google flows both submit it before this
  // point (register / send-mobile-otp create the BrandProfile up front), so
  // this only blocks accounts that skipped the GST step via direct API calls
  // (e.g. hitting resend-otp + verify-otp without ever providing a GSTIN).
  if (user.role === 'brand') {
    const brandProfile = await BrandProfile.findOne({ userId: user._id });
    if (!brandProfile || !brandProfile.gstin) {
      return { activated: false, error: 'A GST number is required to activate a brand account. Please complete your brand details.' };
    }
  }

  await User.findByIdAndUpdate(user._id, { status: 'active' });

  return { activated: true, token: generateToken(user._id) };
}

// Fires the welcome email and (for brands) the GSTIN-submitted acknowledgement
// + admin notice — once, no matter how many times this is called. Guarded by
// an atomic claim on `activationNotified` rather than a plain read-then-write,
// so a retry or a double-click on "Skip" can't send the welcome email twice.
async function sendActivationNotifications(user) {
  const claimed = await User.findOneAndUpdate(
    { _id: user._id, activationNotified: { $ne: true } },
    { activationNotified: true }
  );
  if (!claimed) return; // already sent (or lost the race to another request)

  notify.welcome(user.email, { name: user.name, role: user.role, mobileVerified: user.mobileVerified });

  if (user.role === 'brand') {
    const brandProfile = await BrandProfile.findOne({ userId: user._id });
    if (brandProfile) {
      notify.gstinSubmitted(user.email, {
        companyName: brandProfile.companyName || user.name,
        gstin: brandProfile.gstin,
      });
      getAdminEmails().then((adminEmails) => {
        if (!adminEmails.length) return;
        notify.gstinSubmittedAdmin(adminEmails, {
          companyName: brandProfile.companyName || user.name,
          gstin: brandProfile.gstin,
          brandEmail: user.email,
        });
      }).catch((err) => console.error('[EMAIL:gstinSubmittedAdmin] admin lookup failed', err.message));
    }
  }
}

// ─────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, type, otp } = req.body;

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      userId,
      type,
      used: false
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP not found or already used' });
    }

    // Check if expired
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      const locked = await registerFailedOtpAttempt(otpRecord);
      return res.status(400).json({
        error: locked
          ? 'Too many incorrect attempts. Please request a new code.'
          : 'Incorrect OTP. Please try again.'
      });
    }

    // Mark OTP as used
    await OTP.findByIdAndUpdate(otpRecord._id, { used: true });

    // Update user verification status
    if (type === 'email') {
      await User.findByIdAndUpdate(userId, { emailVerified: true });
    } else {
      // Commit the staged mobile to the live field now that the OTP proves ownership.
      const pendingUser = await User.findById(userId).select('pendingMobile');
      const mobileUpdate = { mobileVerified: true, pendingMobile: null };
      if (pendingUser?.pendingMobile) mobileUpdate.mobile = pendingUser.pendingMobile;
      await User.findByIdAndUpdate(userId, mobileUpdate);
    }

    const user = await User.findById(userId);
    const { activated, token, error: activationError } = await tryActivateUser(user);

    if (activationError) {
      return res.status(400).json({ error: activationError });
    }

    // For everyone except a brand activating on email alone, this IS the
    // signup flow's finish line (mobile was the last, mandatory step) — send
    // the welcome/GSTIN emails right here. A brand that just activated still
    // has the mobile skip-or-verify screen ahead of it; its notifications
    // wait for POST /api/auth/finish-signup, called once it actually reaches
    // the dashboard either way (see verify-mobile/page.tsx).
    if (activated && !(user.role === 'brand' && type === 'email')) {
      await sendActivationNotifications(user);
    }

    if (activated) {
      return res.json({
        message: 'Account fully verified. Welcome to Influence Connect.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          tier: user.tier
        }
      });
    }

    res.json({
      message: `${type} verified successfully.`,
      emailVerified: user.emailVerified,
      mobileVerified: user.mobileVerified
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ─────────────────────────────────────────
// FINISH SIGNUP  (brand's mobile step, after skip or verify)
// ─────────────────────────────────────────
// A brand activates as soon as its email is verified (see tryActivateUser),
// but mobile is still optional after that — so the welcome/GSTIN emails are
// deliberately held until the brand actually leaves the mobile step, whether
// by verifying it or clicking "Skip for now" (verify-mobile/page.tsx calls
// this from both paths). Authenticated rather than userId-in-body: by this
// point the brand already holds the token issued at activation.
exports.finishSignup = async (req, res) => {
  try {
    await sendActivationNotifications(req.user);
    res.json({ message: 'Signup complete.' });
  } catch (error) {
    console.error('Finish signup error:', error);
    // The account is already active regardless — never block the redirect to
    // the dashboard over a notification failure.
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// Generates a fresh OTP for `user`/`type`, invalidating any previous unused
// one, and emails it. Shared by a plain resend and by updatePendingContact
// (edit-then-resend, when the email/mobile itself was wrong) so the two
// don't drift out of sync. Wording adapts for a true first send (mobile's
// code is no longer pre-sent at registration — see register()) vs a
// resend/correction.
async function issueOtp(user, type) {
  const isFirstSend = !(await OTP.exists({ userId: user._id, type }));

  // Invalidate previous unused OTPs of this type
  await OTP.deleteMany({ userId: user._id, type, used: false });

  const newOTP = generateOTP();
  await OTP.create({ userId: user._id, type, otp: newOTP });

  const devBypass = process.env.DEV_OTP_EMAIL;

  if (type === 'email') {
    const recipient = devBypass || user.email;
    const { error: emailError } = await resend.emails.send({
      from: FROM,
      to: recipient,
      subject: devBypass
        ? `[DEV] New OTP for ${user.email} — Influence Connect`
        : 'Your new Influence Connect verification code',
      html: buildOtpEmail({
        role: user.role,
        heading: 'New verification code',
        body: `You requested a new code to verify your email address. Use the code below — your previous code has been invalidated.`,
        otp: newOTP,
        codeLabel: 'Email verification code',
        devNote: devBypass ? `DEV BYPASS — original recipient: ${user.email}` : null
      })
    });
    if (emailError) {
      console.error('Resend error:', emailError);
      return { ok: false, error: 'Failed to send email. Please try again.' };
    }
  }

  if (type === 'mobile') {
    const recipient = devBypass || user.email;
    await resend.emails.send({
      from: FROM,
      to: recipient,
      subject: devBypass
        ? `[DEV] Mobile OTP for ${user.mobile} — Influence Connect`
        : isFirstSend
          ? 'Verify your mobile number — Influence Connect'
          : 'Your new mobile verification code — Influence Connect',
      html: buildOtpEmail({
        role: user.role,
        heading: isFirstSend ? 'Verify your mobile number' : 'New mobile verification code',
        body: isFirstSend
          ? `Use the code below to verify the mobile number <strong>${user.mobile}</strong> on your Influence Connect account.`
          : `You requested a new code to verify the mobile number <strong>${user.mobile}</strong>. Your previous code has been invalidated.`,
        otp: newOTP,
        codeLabel: 'Mobile verification code',
        devNote: devBypass ? `DEV BYPASS — original recipient: ${user.mobile}` : null
      })
    });
    console.log(`[OTP] Mobile OTP for ${user.mobile}: ${newOTP}`);
  }

  return { ok: true };
}

// ─────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const { userId, type } = req.body;
    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type are required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (type === 'email' && user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }
    if (type === 'mobile' && user.mobileVerified) {
      return res.status(400).json({ error: 'Mobile is already verified.' });
    }

    const result = await issueOtp(user, type);
    if (!result.ok) return res.status(500).json({ error: result.error });

    res.json({ message: `New ${type} OTP sent successfully.` });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ─────────────────────────────────────────
// UPDATE PENDING CONTACT  (fix a typo'd email/mobile mid-signup)
// ─────────────────────────────────────────
// "Wrong email/mobile?" on verify-email / verify-mobile used to send the user
// all the way back to the signup form. This lets them correct it in place —
// still keyed by userId rather than authenticated, same as verify-otp/
// resend-otp, since at the email step there's no token yet. Mirrors
// register()'s uniqueness handling: a genuinely-taken address still blocks
// the edit, but one that only belongs to someone else's abandoned,
// never-verified signup is reclaimed rather than blocking forever.
exports.updatePendingContact = async (req, res) => {
  try {
    const { userId, type, value } = req.body;
    if (!userId || !type || !value) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (type !== 'email' && type !== 'mobile') {
      return res.status(400).json({ error: 'Invalid field.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (type === 'email') {
      if (user.emailVerified) {
        return res.status(400).json({ error: 'Email is already verified.' });
      }
      const normalized = String(value).trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalized)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      const existing = await User.findOne({ email: normalized, _id: { $ne: userId } });
      if (existing) {
        if (!isReclaimableSignup(existing)) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        await purgeAbandonedSignup(existing._id);
      }
      user.email = normalized;
    } else {
      if (user.mobileVerified) {
        return res.status(400).json({ error: 'Mobile is already verified.' });
      }
      const digits = String(value).replace(/\D/g, '').slice(-10);
      const cleanMobile = `+91${digits}`;
      if (!MOBILE_REGEX.test(cleanMobile)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
      }
      const existing = await User.findOne({ mobile: cleanMobile, _id: { $ne: userId } });
      if (existing) {
        if (!isReclaimableSignup(existing)) {
          return res.status(400).json({ error: 'Mobile number already registered' });
        }
        await purgeAbandonedSignup(existing._id);
      }
      user.mobile = cleanMobile;
    }

    await user.save();

    const result = await issueOtp(user, type);
    if (!result.ok) return res.status(500).json({ error: result.error });

    res.json({
      message: `${type === 'email' ? 'Email' : 'Mobile number'} updated. A new code has been sent.`,
      email: user.email,
      mobile: user.mobile,
    });

  } catch (error) {
    console.error('Update pending contact error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
// `adminPortal` marks a sign-in arriving from the admin console, which is a
// closed, hand-provisioned surface and so carries no Turnstile widget. The bot
// check is skipped for it; brute force is still held off by the per-account
// lockout below and the route's rate limiter. Only real admin accounts may use
// that path — anything else gets the generic credential error, so it can't be
// used as a Turnstile-free oracle against ordinary accounts.
async function loginHandler(req, res, { adminPortal = false } = {}) {
  try {
    const { email, password, role, turnstileToken } = req.body;

    // Belt-and-braces alongside the global operator stripper (see
    // middleware/sanitize.middleware.js): reject non-string credentials
    // outright so a crafted body can never reach the Mongoose filter.
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!adminPortal) {
      const isHuman = await verifyTurnstileToken(turnstileToken, req.ip);
      if (!isHuman) {
        return res.status(400).json({ error: 'Bot verification failed. Please refresh and try again.' });
      }
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Non-admins can't sign in through the admin console, and are told nothing
    // more than "wrong credentials" so this route reveals no account details.
    if (adminPortal && user.role !== 'admin') {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Google-registered account — cannot log in with password
    if (user.signupMethod === 'google') {
      return res.status(403).json({
        error: 'This account uses Google Sign-In. Please continue with Google to log in.',
        code: 'USE_GOOGLE'
      });
    }

    // Check if account is active
    if (user.deletedAt) {
      return res.status(403).json({ error: 'This account has been deleted.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Please verify your email and mobile before logging in.' });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const secondsLeft = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return res.status(403).json({
        error: `Account locked due to too many failed attempts. Try again in ${Math.ceil(secondsLeft / 60)} minute(s).`,
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockUntil,
      });
    }

    // Expired lock — reset counter so the user gets a fresh set of attempts
    if (user.lockUntil && user.lockUntil <= Date.now()) {
      user.loginAttempts = 0;
      user.lockUntil = null;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.loginAttempts = 0;
        await user.save();
        return res.status(403).json({
          error: 'Account locked for 15 minutes due to too many failed attempts.',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: user.lockUntil,
        });
      }

      await user.save();
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      return res.status(400).json({
        error: `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before lockout.`,
      });
    }

    // Correct password — clear any lingering lockout state
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Role-themed login pages (brand vs. creator) pass which portal the user
    // picked — checked only AFTER the password is verified, so a wrong-role
    // guess can't be used to probe which role an email is registered as.
    if (role && ['brand', 'influencer'].includes(role) && user.role !== role) {
      return res.status(404).json({
        error: `No ${role} account was found with this email.`,
        code: 'ROLE_MISMATCH',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Audit trail for admin sign-ins.
    if (user.role === 'admin') {
      await logAdminAction({
        adminId: user._id,
        adminName: user.name,
        action: 'ADMIN_LOGIN',
        targetType: 'system',
        targetId: user.customId || '',
        targetName: user.name,
        details: `Admin "${user.name}" logged in.`,
        metadata: {},
        ipAddress:
          (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
          req.ip ||
          req.socket?.remoteAddress ||
          '',
      });
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        tier: user.tier
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

exports.login = (req, res) => loginHandler(req, res);
exports.adminLogin = (req, res) => loginHandler(req, res, { adminPortal: true });

// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email, turnstileToken } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const isHuman = await verifyTurnstileToken(turnstileToken, req.ip);
    if (!isHuman) {
      return res.status(400).json({ error: 'Bot verification failed. Please refresh and try again.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't leak whether the email exists
      return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
    }

    if (user.signupMethod === 'google') {
      return res.status(400).json({
        error: 'This account uses Google Sign-In. Password reset is not available.',
        code: 'USE_GOOGLE'
      });
    }

    // Invalidate previous unused reset OTPs
    await OTP.deleteMany({ userId: user._id, type: 'password_reset', used: false });

    const otp = generateOTP();
    await OTP.create({ userId: user._id, type: 'password_reset', otp });

    const devBypass = process.env.DEV_OTP_EMAIL;
    const recipient = devBypass || email;

    const { error: emailError } = await resend.emails.send({
      from: FROM,
      to: recipient,
      subject: devBypass
        ? `[DEV] Password Reset for ${email} — Influence Connect`
        : 'Reset your Influence Connect password',
      html: buildOtpEmail({
        role: user.role,
        heading: 'Reset your password',
        body: 'We received a request to reset the password for your Influence Connect account. Use the code below — it expires in <strong>10 minutes</strong>.',
        otp,
        codeLabel: 'Your reset code',
        devNote: devBypass ? `DEV BYPASS — original recipient: ${email}` : null,
        warning: false,
        footerNote: 'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.',
      })
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
    }

    res.json({ message: 'Reset code sent.', userId: user._id });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ─────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const otpRecord = await OTP.findOne({ userId, type: 'password_reset', used: false });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Reset code not found or already used.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    if (otpRecord.otp !== otp) {
      const locked = await registerFailedOtpAttempt(otpRecord);
      return res.status(400).json({
        error: locked
          ? 'Too many incorrect attempts. Please request a new reset code.'
          : 'Incorrect code. Please try again.'
      });
    }

    await OTP.findByIdAndUpdate(otpRecord._id, { used: true });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ─────────────────────────────────────────
// SEND MOBILE OTP  (Google OAuth completion)
// ─────────────────────────────────────────
exports.sendMobileOtp = async (req, res) => {
  try {
    const { setupToken, mobile, gstin } = req.body;

    if (!setupToken || !mobile) {
      return res.status(400).json({ error: 'Setup token and mobile number are required.' });
    }

    // Validate the short-lived registration token issued during Google OAuth.
    // This prevents unauthenticated callers from overwriting any user's mobile.
    let decoded;
    try {
      decoded = jwt.verify(setupToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired setup token. Please sign in with Google again.' });
    }

    if (decoded.purpose !== 'mobile-setup') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const userId = decoded.userId;

    const cleanMobile = mobile.startsWith('+91') ? mobile : `+91${mobile}`;

    if (!/^\+91[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number.' });
    }

    // Block if mobile already registered to a different user
    const taken = await User.findOne({ mobile: cleanMobile, _id: { $ne: userId } });
    if (taken) {
      return res.status(400).json({ error: 'This mobile number is already registered to another account.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Brands completing a Google signup must also submit a valid GSTIN — it's
    // collected on the same step as the mobile number.
    let normalizedGstin = null;
    if (user.role === 'brand') {
      normalizedGstin = normalizeGstin(gstin);
      if (!normalizedGstin) {
        return res.status(400).json({ error: 'GST number is required to register as a brand.' });
      }
      if (!isValidGstin(normalizedGstin)) {
        return res.status(400).json({ error: 'Please enter a valid 15-character GST number.' });
      }
    }

    // Stage the mobile — committed to the live `mobile` field only after OTP verification.
    await User.findByIdAndUpdate(userId, { pendingMobile: cleanMobile });

    // Ensure the brand profile carries the submitted GSTIN, queued for admin
    // review. The "GSTIN is being verified" acknowledgement is NOT sent here —
    // it goes out only once the account is fully verified and active (see
    // verifyOTP), so an abandoned signup never receives it.
    if (user.role === 'brand' && normalizedGstin) {
      let profile = await BrandProfile.findOne({ userId });
      if (!profile) {
        await BrandProfile.create({
          userId,
          gstin: normalizedGstin,
          gstinStatus: 'pending',
          gstinVerified: false,
        });
      } else if (normalizedGstin !== profile.gstin) {
        profile.gstin = normalizedGstin;
        profile.gstinStatus = 'pending';
        profile.gstinVerified = false;
        await profile.save();
      }
    }

    // Clear any previous unused mobile OTPs
    await OTP.deleteMany({ userId, type: 'mobile', used: false });

    const mobileOTP = generateOTP();
    await OTP.create({ userId, type: 'mobile', otp: mobileOTP });

    // MSG91 isn't wired up yet, so it's emailed to the account's own address
    // instead (bypass inbox in dev, real address otherwise).
    const devBypass = process.env.DEV_OTP_EMAIL;
    await resend.emails.send({
      from: FROM,
      to: devBypass || user.email,
      subject: devBypass
        ? `[DEV] Mobile OTP for ${cleanMobile} — Influence Connect`
        : 'Verify your mobile number — Influence Connect',
      html: buildOtpEmail({
        heading: 'Verify your mobile number',
        body: `Use the code below to verify the mobile number <strong>${cleanMobile}</strong> linked to your Influence Connect account.`,
        otp: mobileOTP,
        codeLabel: 'Mobile verification code',
        devNote: devBypass ? `DEV BYPASS — original recipient: ${cleanMobile}` : null
      })
    });
    console.log(`[OTP] Mobile OTP for ${cleanMobile}: ${mobileOTP}`);

    res.json({ message: 'OTP sent to your mobile number.' });

  } catch (error) {
    console.error('Send mobile OTP error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ─────────────────────────────────────────
// UPGRADE PLAN  (payment bypass for dev/testing)
// ─────────────────────────────────────────
exports.upgradePlan = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { isValidTier } = require('../utils/tiers');
    const requested = req.body?.tier;
    const topTier = user.role === 'brand' ? 'golden' : 'platinum';
    const tier = requested && isValidTier(user.role, requested) ? requested : topTier;

    applyPremiumUpgrade(user, tier, 365); // dev bypass — 1 year, no payment involved
    await user.save();

    res.json({
      message: `Plan upgraded to ${tier}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        tier: user.tier,
        premiumStartedAt: user.premiumStartedAt,
        premiumUntil: user.premiumUntil,
      },
    });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// DOWNGRADE PLAN  (dev/testing only — back to freemium)
// Premium is a one-time, non-cancellable purchase in production: it simply
// expires on premiumUntil (enforced in auth.middleware.js) rather than being
// revocable by the user. This handler exists only to reset local test state.
// ─────────────────────────────────────────
exports.downgradePlan = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.plan = 'freemium';
    user.tier = 'free';
    user.premiumStartedAt = null;
    user.premiumUntil = null;
    await user.save();

    res.json({
      message: 'Plan downgraded to Free.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        tier: user.tier,
      },
    });
  } catch (error) {
    console.error('Downgrade plan error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// GET ACCOUNT INFO
// ─────────────────────────────────────────
exports.getAccountInfo = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      // Lets the settings page offer a "Verify" action for a brand's mobile
      // number when it was skipped at signup (see requestMobileChange, which
      // now allows re-requesting the SAME number when it isn't verified yet).
      mobileVerified: user.mobileVerified,
      role: user.role,
      plan: user.plan,
      tier: user.tier,
      autopay: user.autopay,
      premiumStartedAt: user.premiumStartedAt,
      premiumUntil: user.premiumUntil,
      freeTrialClaimedAt: user.freeTrialClaimedAt,
      // Read-only mirror of claimFreeTrial's real eligibility filter (see
      // payment.controller.js) — drives whether the billing page shows the
      // offer at all. The actual grant is re-checked atomically server-side
      // regardless, so this being stale/spoofed can never let anyone through
      // twice; it only affects whether the button is shown.
      freeTrialAvailable: !user.freeTrialClaimedAt && user.tier === 'free' && !user.premiumStartedAt && user.status === 'active',
      signupMethod: user.signupMethod,
      createdAt: user.createdAt,
      deleteScheduledAt: user.deleteScheduledAt,
    });
  } catch (error) {
    console.error('Get account info error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// UPDATE NAME (direct, no OTP needed)
// ─────────────────────────────────────────
exports.updateAccountInfo = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.name = name.trim();
    await user.save();

    res.json({
      message: 'Name updated successfully.',
      user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile },
    });
  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// REQUEST EMAIL CHANGE — sends OTP to new email
// ─────────────────────────────────────────
exports.requestEmailChange = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'New email is required.' });

    const newEmail = email.toLowerCase().trim();
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (newEmail === user.email) return res.status(400).json({ error: 'This is already your current email address.' });

    const exists = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ error: 'This email is already in use by another account.' });

    // Invalidate any previous pending email-change OTPs
    await OTP.updateMany({ userId: user._id, type: 'email_change', used: false }, { used: true });

    const code = generateOTP();
    await OTP.create({ userId: user._id, type: 'email_change', otp: code, pendingValue: newEmail });

    const devBypass = process.env.DEV_OTP_EMAIL;
    await resend.emails.send({
      from: FROM,
      to: devBypass || newEmail,
      subject: devBypass ? `[DEV] Email change OTP for ${newEmail} — Influence Connect` : 'Confirm your new email — Influence Connect',
      html: buildOtpEmail({
        heading: 'Confirm your new email address',
        body: `You requested to change your Influence Connect email to <strong>${newEmail}</strong>. Use the code below to confirm.`,
        otp: code,
        codeLabel: 'Email confirmation code',
        devNote: devBypass ? `DEV BYPASS — original recipient: ${newEmail}` : null,
      }),
    });

    res.json({ message: `A verification code has been sent to ${newEmail}.` });
  } catch (error) {
    console.error('Request email change error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// VERIFY EMAIL CHANGE — applies the new email
// ─────────────────────────────────────────
exports.verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required.' });

    const otpRecord = await OTP.findOne({ userId: req.userId, type: 'email_change', used: false });
    if (!otpRecord) return res.status(400).json({ error: 'No pending email change found. Please request a new code.' });
    if (otpRecord.expiresAt < new Date()) return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    if (otpRecord.otp !== otp) {
      const locked = await registerFailedOtpAttempt(otpRecord);
      return res.status(400).json({
        error: locked
          ? 'Too many incorrect attempts. Please request a new code.'
          : 'Incorrect code. Please try again.'
      });
    }

    const newEmail = otpRecord.pendingValue;
    const exists = await User.findOne({ email: newEmail, _id: { $ne: req.userId } });
    if (exists) return res.status(409).json({ error: 'This email was taken by another account. Please try a different one.' });

    await OTP.findByIdAndUpdate(otpRecord._id, { used: true });

    const user = await User.findById(req.userId);
    user.email = newEmail;
    user.emailVerified = true;
    await user.save();

    res.json({ message: 'Email updated successfully.', email: user.email });
  } catch (error) {
    console.error('Verify email change error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// REQUEST MOBILE CHANGE — sends OTP to new number
// ─────────────────────────────────────────
exports.requestMobileChange = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'New phone number is required.' });

    const newMobile = mobile.trim();
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // A brand can activate having skipped mobile verification at signup (see
    // tryActivateUser), leaving `mobile` set but `mobileVerified: false`. This
    // same request+verify pair doubles as that catch-up flow, so only block
    // "changing" to the current number once it's actually verified — an
    // unverified one re-requesting itself is the intended way to verify it.
    if (newMobile === user.mobile && user.mobileVerified) {
      return res.status(400).json({ error: 'This is already your current, verified phone number.' });
    }

    const exists = await User.findOne({ mobile: newMobile, _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ error: 'This phone number is already in use by another account.' });

    await OTP.updateMany({ userId: user._id, type: 'mobile_change', used: false }, { used: true });

    const code = generateOTP();
    await OTP.create({ userId: user._id, type: 'mobile_change', otp: code, pendingValue: newMobile });

    const devBypass = process.env.DEV_OTP_EMAIL;
    await resend.emails.send({
      from: FROM,
      to: devBypass || user.email,
      subject: devBypass
        ? `[DEV] Mobile change OTP for ${newMobile} — Influence Connect`
        : 'Confirm your new phone number — Influence Connect',
      html: buildOtpEmail({
        heading: 'Confirm your new phone number',
        body: `You requested to change your phone number to <strong>${newMobile}</strong>. Use the code below to confirm.`,
        otp: code,
        codeLabel: 'Mobile confirmation code',
        devNote: devBypass ? `DEV BYPASS — original recipient: ${newMobile}` : null,
      }),
    });
    console.log(`[OTP] Mobile change OTP for ${newMobile}: ${code}`);

    res.json({ message: `A verification code has been sent to ${newMobile}.` });
  } catch (error) {
    console.error('Request mobile change error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// VERIFY MOBILE CHANGE — applies the new number
// ─────────────────────────────────────────
exports.verifyMobileChange = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required.' });

    const otpRecord = await OTP.findOne({ userId: req.userId, type: 'mobile_change', used: false });
    if (!otpRecord) return res.status(400).json({ error: 'No pending phone change found. Please request a new code.' });
    if (otpRecord.expiresAt < new Date()) return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    if (otpRecord.otp !== otp) {
      const locked = await registerFailedOtpAttempt(otpRecord);
      return res.status(400).json({
        error: locked
          ? 'Too many incorrect attempts. Please request a new code.'
          : 'Incorrect code. Please try again.'
      });
    }

    const newMobile = otpRecord.pendingValue;
    const exists = await User.findOne({ mobile: newMobile, _id: { $ne: req.userId } });
    if (exists) return res.status(409).json({ error: 'This number was taken by another account. Please try a different one.' });

    await OTP.findByIdAndUpdate(otpRecord._id, { used: true });

    const user = await User.findById(req.userId);
    user.mobile = newMobile;
    user.mobileVerified = true;
    await user.save();

    res.json({ message: 'Phone number updated successfully.', mobile: user.mobile });
  } catch (error) {
    console.error('Verify mobile change error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// REQUEST MOBILE CORRECTION  (email fallback for an unreachable number)
// ─────────────────────────────────────────
// requestMobileChange above already lets anyone fix a wrong number without
// needing anything from the OLD one — it only asks for proof of the NEW
// number. This exists for the narrower case: the account owner doesn't have
// a working number to hand *at all* right now (lost phone, no replacement
// yet) but still wants to correct the record, using the one channel they can
// always reach — their already-verified email. Only offered while mobile is
// unverified: a verified number's owner has already proven phone possession
// once and should keep going through the real SMS flow to change it.
//
// Deliberately does NOT mark the corrected number as verified — email proves
// identity (who's asking), not phone possession, and conflating the two
// would make "Verified" mean something weaker everywhere else it's read
// (fraud signals, admin views, trust badges). See confirmMobileCorrection.
exports.requestMobileCorrection = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.mobileVerified) {
      return res.status(400).json({ error: 'Your mobile number is already verified. Use the standard change flow instead.' });
    }

    await OTP.updateMany({ userId: user._id, type: 'mobile_correction', used: false }, { used: true });

    const code = generateOTP();
    await OTP.create({ userId: user._id, type: 'mobile_correction', otp: code });

    const devBypass = process.env.DEV_OTP_EMAIL;
    const { error: emailError } = await resend.emails.send({
      from: FROM,
      to: devBypass || user.email,
      subject: devBypass
        ? `[DEV] Mobile correction code for ${user.email} — Influence Connect`
        : "Confirm it's you — Influence Connect",
      html: buildOtpEmail({
        role: user.role,
        heading: "Confirm it's you",
        body: `You asked to correct the mobile number on your account by email, since the current one can't be reached. Use the code below to confirm it's really you.`,
        otp: code,
        codeLabel: 'Confirmation code',
        devNote: devBypass ? `DEV BYPASS — original recipient: ${user.email}` : null,
      }),
    });
    if (emailError) {
      console.error('Resend error:', emailError);
      return res.status(500).json({ error: 'Failed to send confirmation email. Please try again.' });
    }

    res.json({ message: `A confirmation code has been sent to ${user.email}.` });
  } catch (error) {
    console.error('Request mobile correction error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// CONFIRM MOBILE CORRECTION  (applies the corrected number, still unverified)
// ─────────────────────────────────────────
exports.confirmMobileCorrection = async (req, res) => {
  try {
    const { otp, mobile } = req.body;
    if (!otp || !mobile) {
      return res.status(400).json({ error: 'Confirmation code and mobile number are required.' });
    }

    const otpRecord = await OTP.findOne({ userId: req.userId, type: 'mobile_correction', used: false });
    if (!otpRecord) return res.status(400).json({ error: 'No pending request found. Please request a new code.' });
    if (otpRecord.expiresAt < new Date()) return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    if (otpRecord.otp !== otp) {
      const locked = await registerFailedOtpAttempt(otpRecord);
      return res.status(400).json({
        error: locked
          ? 'Too many incorrect attempts. Please request a new code.'
          : 'Incorrect code. Please try again.'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    // Re-checked in case the account was verified through the normal SMS
    // flow (a different tab, say) in the time between request and confirm.
    if (user.mobileVerified) {
      return res.status(400).json({ error: 'Your mobile number is already verified.' });
    }

    const digits = String(mobile).replace(/\D/g, '').slice(-10);
    const newMobile = `+91${digits}`;
    if (!MOBILE_REGEX.test(newMobile)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    const exists = await User.findOne({ mobile: newMobile, _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ error: 'This phone number is already in use by another account.' });

    await OTP.findByIdAndUpdate(otpRecord._id, { used: true });

    user.mobile = newMobile;
    user.mobileVerified = false; // corrected, but phone possession still unproven
    await user.save();

    res.json({
      message: "Mobile number updated. It's still unverified — verify it via SMS whenever you can access it.",
      mobile: user.mobile,
      mobileVerified: false,
    });
  } catch (error) {
    console.error('Confirm mobile correction error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.signupMethod === 'google' && !user.password) {
      return res.status(400).json({ error: 'Google accounts do not have a password to change.' });
    }

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// SCHEDULE ACCOUNT DELETION (30-day grace)
// ─────────────────────────────────────────
exports.scheduleAccountDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const deleteAt = new Date();
    deleteAt.setDate(deleteAt.getDate() + 30);
    user.deleteScheduledAt = deleteAt;
    await user.save();

    notify.accountDeletionScheduled(user.email, { name: user.name, deleteAt, role: user.role });

    res.json({
      message: 'Account deletion scheduled. Your account will be permanently deleted in 30 days.',
      deleteScheduledAt: user.deleteScheduledAt,
    });
  } catch (error) {
    console.error('Schedule deletion error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// CANCEL ACCOUNT DELETION
// ─────────────────────────────────────────
exports.cancelAccountDeletion = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (!user.deleteScheduledAt) {
      return res.status(400).json({ error: 'No deletion scheduled for this account.' });
    }

    user.deleteScheduledAt = null;
    await user.save();

    notify.accountDeletionCancelled(user.email, { name: user.name, role: user.role });

    res.json({ message: 'Account deletion cancelled. Your account is safe.' });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// PURGE SCHEDULED DELETIONS  (Vercel Cron only, gated by CRON_SECRET — see
// backend/utils/purgeAccount.js for what "purge" actually does)
// ─────────────────────────────────────────
exports.purgeScheduledDeletions = async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const { purgeDueAccounts } = require('../utils/purgeAccount');
    const result = await purgeDueAccounts();
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Purge scheduled deletions error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
