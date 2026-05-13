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

    // Send email OTP via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your Influence Connect verification code',
      html: `
        <h2>Verify your email</h2>
        <p>Your OTP is <strong style="font-size: 24px;">${emailOTP}</strong></p>
        <p>Valid for 10 minutes. Do not share this with anyone.</p>
      `
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    // Mobile OTP — will be sent via MSG91 (added when MSG91 is set up)
    console.log(`Mobile OTP for ${mobile}: ${mobileOTP}`); // temporary for testing

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

    // TODO: Send via MSG91 when configured. Logging for now.
    console.log(`[OTP] Mobile OTP for ${cleanMobile}: ${mobileOTP}`);

    res.json({ message: 'OTP sent to your mobile number.' });

  } catch (error) {
    console.error('Send mobile OTP error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};