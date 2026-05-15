const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/auth/google/callback`,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Returning user — already linked Google
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    const email = profile.emails?.[0]?.value;
    if (!email) return done(null, false, { message: 'No email from Google account' });

    // Email already registered via email/password — do NOT link; ask them to use password
    user = await User.findOne({ email });
    if (user) {
      return done(null, false, { message: 'email_exists' });
    }

    // Role is passed through OAuth state from the signup page selection
    const role = req.query.state === 'brand' ? 'brand' : 'influencer';

    // Brand-new Google user — mobile not collected yet
    user = await User.create({
      name: profile.displayName,
      email,
      mobile: `__google__${profile.id}`,
      password: require('crypto').randomBytes(32).toString('hex'),
      role,
      googleId: profile.id,
      emailVerified: true,
      mobileVerified: false,
      status: 'pending',
      signupMethod: 'google'
    });

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
