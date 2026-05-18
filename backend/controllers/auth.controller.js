const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6 digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
        : 'Your Influence Connect verification code',
      html: `
        <h2>Verify your email</h2>
        ${devBypass ? `<p style="color:#888;font-size:12px;">DEV BYPASS — original recipient: ${email}</p>` : ''}
        <p>Your email OTP is <strong style="font-size: 24px; letter-spacing: 4px;">${emailOTP}</strong></p>
        <p>Valid for 10 minutes. Do not share this with anyone.</p>
      `
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
        html: `
          <h2>Mobile OTP (dev bypass)</h2>
          <p style="color:#888;font-size:12px;">Original recipient: +91${mobile}</p>
          <p>Your mobile OTP is <strong style="font-size: 24px; letter-spacing: 4px;">${mobileOTP}</strong></p>
          <p>Valid for 10 minutes.</p>
        `
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
        html: `
          <h2>New verification code</h2>
          ${devBypass ? `<p style="color:#888;font-size:12px;">DEV BYPASS — original recipient: ${user.email}</p>` : ''}
          <p>Your new email OTP is <strong style="font-size: 24px; letter-spacing: 4px;">${newOTP}</strong></p>
          <p>Valid for 10 minutes. Do not share this with anyone.</p>
        `
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
          html: `
            <h2>New mobile OTP (dev bypass)</h2>
            <p style="color:#888;font-size:12px;">Original recipient: ${user.mobile}</p>
            <p>Your new mobile OTP is <strong style="font-size: 24px; letter-spacing: 4px;">${newOTP}</strong></p>
            <p>Valid for 10 minutes.</p>
          `
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
        html: `
          <h2>Mobile OTP (dev bypass)</h2>
          <p style="color:#888;font-size:12px;">Original recipient: ${cleanMobile}</p>
          <p>Your mobile OTP is <strong style="font-size: 24px; letter-spacing: 4px;">${mobileOTP}</strong></p>
          <p>Valid for 10 minutes.</p>
        `
      });
    }
    console.log(`[OTP] Mobile OTP for ${cleanMobile}: ${mobileOTP}`);

    res.json({ message: 'OTP sent to your mobile number.' });

  } catch (error) {
    console.error('Send mobile OTP error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};