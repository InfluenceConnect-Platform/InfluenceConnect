const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6 digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Professional email OTP template
function buildOtpEmail({ title, heading, body, otp, codeLabel, devNote }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Top accent bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#7FA8AD,#5D8A8F,#3D5087);"></td></tr>

        <tr><td style="padding:36px 40px 32px;">

          <!-- Logo -->
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

          ${devNote ? `<p style="color:#92400e;font-size:11px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;margin:0 0 20px;">${devNote}</p>` : ''}

          <!-- Heading -->
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${heading}</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">${body}</p>

          <!-- OTP box -->
          <div style="text-align:center;background:linear-gradient(135deg,#f0f9fa,#e8f4f5);border:1px solid #c5dfe2;border-radius:12px;padding:28px 20px;margin-bottom:28px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#5D8A8F;">${codeLabel}</p>
            <p style="margin:0;font-size:38px;font-weight:800;letter-spacing:10px;color:#1e3a5f;font-family:'Courier New',monospace;">${otp}</p>
            <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">Expires in 10 minutes</p>
          </div>

          <!-- Warning -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
            <tr>
              <td width="4" style="background:linear-gradient(180deg,#7FA8AD,#3D5087);border-radius:4px;">&nbsp;</td>
              <td style="padding:10px 14px;">
                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                  Never share this code with anyone. Influence Connect will <strong>never</strong> ask for your OTP.
                </p>
              </td>
            </tr>
          </table>

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
    const { name, email, mobile, password, role } = req.body;

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if mobile already exists
    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    // Create user (password gets hashed automatically via pre-save hook)
    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role
    });

    // Generate OTPs
    const emailOTP = generateOTP();
    const mobileOTP = generateOTP();

    // Save OTPs to database
    await OTP.create({ userId: user._id, type: 'email', otp: emailOTP });
    await OTP.create({ userId: user._id, type: 'mobile', otp: mobileOTP });

    // In dev, redirect all OTPs to the bypass inbox; in prod, send to the real address
    const devBypass = process.env.DEV_OTP_EMAIL;
    const emailRecipient = devBypass || email;

    // Send email OTP via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: emailRecipient,
      subject: devBypass
        ? `[DEV] OTP for ${email} — Influence Connect`
        : 'Verify your Influence Connect account',
      html: buildOtpEmail({
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

    // Mobile OTP — send to bypass email in dev; MSG91 in prod
    if (devBypass) {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: devBypass,
        subject: `[DEV] Mobile OTP for +91${mobile} — Influence Connect`,
        html: buildOtpEmail({
          heading: 'Verify your mobile number',
          body: `Use the code below to verify the mobile number <strong>+91${mobile}</strong> on your Influence Connect account.`,
          otp: mobileOTP,
          codeLabel: 'Mobile verification code',
          devNote: `DEV BYPASS — original recipient: +91${mobile}`
        })
      });
    }
    console.log(`[OTP] Mobile OTP for ${mobile}: ${mobileOTP}`);

    res.status(201).json({
      message: 'Registration successful. Please verify your email and mobile.',
      userId: user._id
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

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
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    // Mark OTP as used
    await OTP.findByIdAndUpdate(otpRecord._id, { used: true });

    // Update user verification status
    if (type === 'email') {
      await User.findByIdAndUpdate(userId, { emailVerified: true });
    } else {
      await User.findByIdAndUpdate(userId, { mobileVerified: true });
    }

    // Check if both are now verified
    const user = await User.findById(userId);
    if (user.emailVerified && user.mobileVerified) {
      await User.findByIdAndUpdate(userId, { status: 'active' });

      // Generate JWT token — user is fully verified
      const token = generateToken(user._id);

      return res.json({
        message: 'Account fully verified. Welcome to Influence Connect.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan
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

    // Invalidate previous unused OTPs of this type
    await OTP.deleteMany({ userId, type, used: false });

    const newOTP = generateOTP();
    await OTP.create({ userId, type, otp: newOTP });

    const devBypass = process.env.DEV_OTP_EMAIL;

    if (type === 'email') {
      const recipient = devBypass || user.email;
      const { error: emailError } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: recipient,
        subject: devBypass
          ? `[DEV] New OTP for ${user.email} — Influence Connect`
          : 'Your new Influence Connect verification code',
        html: buildOtpEmail({
          heading: 'New verification code',
          body: `You requested a new code to verify your email address. Use the code below — your previous code has been invalidated.`,
          otp: newOTP,
          codeLabel: 'Email verification code',
          devNote: devBypass ? `DEV BYPASS — original recipient: ${user.email}` : null
        })
      });
      if (emailError) {
        console.error('Resend error:', emailError);
        return res.status(500).json({ error: 'Failed to send email. Please try again.' });
      }
    }

    if (type === 'mobile') {
      if (devBypass) {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: devBypass,
          subject: `[DEV] New Mobile OTP for ${user.mobile} — Influence Connect`,
          html: buildOtpEmail({
            heading: 'New mobile verification code',
            body: `You requested a new code to verify the mobile number <strong>${user.mobile}</strong>. Your previous code has been invalidated.`,
            otp: newOTP,
            codeLabel: 'Mobile verification code',
            devNote: `DEV BYPASS — original recipient: ${user.mobile}`
          })
        });
      }
      console.log(`[OTP] New mobile OTP for ${user.mobile}: ${newOTP}`);
    }

    res.json({ message: `New ${type} OTP sent successfully.` });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
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
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Please verify your email and mobile before logging in.' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

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
      from: 'onboarding@resend.dev',
      to: recipient,
      subject: devBypass
        ? `[DEV] Password Reset for ${email} — Influence Connect`
        : 'Reset your Influence Connect password',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#f4f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="height:4px;background:linear-gradient(90deg,#7FA8AD,#5D8A8F,#3D5087)"></td></tr>
                <tr><td style="padding:36px 40px 28px;">
                  <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:28px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#7FA8AD,#3D5087);display:inline-flex;align-items:center;justify-content:center;">
                      <span style="color:#fff;font-weight:700;font-size:12px;">IC</span>
                    </div>
                    <span style="font-weight:600;font-size:14px;color:#374151;">Influence Connect</span>
                  </div>
                  ${devBypass ? `<p style="color:#888;font-size:11px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;margin-bottom:20px;">DEV BYPASS — original recipient: ${email}</p>` : ''}
                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h1>
                  <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                    We received a request to reset the password for your Influence Connect account.
                    Use the code below — it expires in <strong>10 minutes</strong>.
                  </p>
                  <div style="text-align:center;background:linear-gradient(135deg,#f0f9fa,#e8f4f5);border:1px solid #c5dfe2;border-radius:12px;padding:28px;margin-bottom:28px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#5D8A8F;">Your reset code</p>
                    <p style="margin:0;font-size:38px;font-weight:800;letter-spacing:10px;color:#1e3a5f;font-family:'Courier New',monospace;">${otp}</p>
                  </div>
                  <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;line-height:1.6;">
                    If you did not request a password reset, you can safely ignore this email.
                    Your password will remain unchanged.
                  </p>
                  <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
                  <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center;">
                    © ${new Date().getFullYear()} Influence Connect · India
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `
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
      return res.status(400).json({ error: 'Incorrect code. Please try again.' });
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
    const { userId, mobile } = req.body;

    if (!userId || !mobile) {
      return res.status(400).json({ error: 'User ID and mobile number are required.' });
    }

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

    // Save mobile to user record
    await User.findByIdAndUpdate(userId, { mobile: cleanMobile });

    // Clear any previous unused mobile OTPs
    await OTP.deleteMany({ userId, type: 'mobile', used: false });

    const mobileOTP = generateOTP();
    await OTP.create({ userId, type: 'mobile', otp: mobileOTP });

    // Send to bypass email in dev; MSG91 in prod
    const devBypass = process.env.DEV_OTP_EMAIL;
    if (devBypass) {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: devBypass,
        subject: `[DEV] Mobile OTP for ${cleanMobile} — Influence Connect`,
        html: buildOtpEmail({
          heading: 'Verify your mobile number',
          body: `Use the code below to verify the mobile number <strong>${cleanMobile}</strong> linked to your Influence Connect account.`,
          otp: mobileOTP,
          codeLabel: 'Mobile verification code',
          devNote: `DEV BYPASS — original recipient: ${cleanMobile}`
        })
      });
    }
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

    user.plan = 'premium';
    user.premiumUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    await user.save();

    res.json({
      message: 'Plan upgraded to Premium.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        premiumUntil: user.premiumUntil,
      },
    });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ─────────────────────────────────────────
// DOWNGRADE PLAN  (back to freemium)
// ─────────────────────────────────────────
exports.downgradePlan = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.plan = 'freemium';
    user.premiumUntil = null;
    await user.save();

    res.json({
      message: 'Plan downgraded to Freemium.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
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
      role: user.role,
      plan: user.plan,
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
      from: 'onboarding@resend.dev',
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
    if (otpRecord.otp !== otp) return res.status(400).json({ error: 'Incorrect code. Please try again.' });

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

    if (newMobile === user.mobile) return res.status(400).json({ error: 'This is already your current phone number.' });

    const exists = await User.findOne({ mobile: newMobile, _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ error: 'This phone number is already in use by another account.' });

    await OTP.updateMany({ userId: user._id, type: 'mobile_change', used: false }, { used: true });

    const code = generateOTP();
    await OTP.create({ userId: user._id, type: 'mobile_change', otp: code, pendingValue: newMobile });

    const devBypass = process.env.DEV_OTP_EMAIL;
    if (devBypass) {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: devBypass,
        subject: `[DEV] Mobile change OTP for ${newMobile} — Influence Connect`,
        html: buildOtpEmail({
          heading: 'Confirm your new phone number',
          body: `You requested to change your phone number to <strong>${newMobile}</strong>. Use the code below to confirm.`,
          otp: code,
          codeLabel: 'Mobile confirmation code',
          devNote: `DEV BYPASS — original recipient: ${newMobile}`,
        }),
      });
    }
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
    if (otpRecord.otp !== otp) return res.status(400).json({ error: 'Incorrect code. Please try again.' });

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

    res.json({ message: 'Account deletion cancelled. Your account is safe.' });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
