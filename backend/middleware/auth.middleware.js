const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    // Get token from request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user from token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    if (user.status === 'suspended') {
      // `code` lets the frontend reliably distinguish a mid-session suspension
      // from other 403s and end the session immediately.
      return res.status(403).json({
        error: 'Your account has been suspended.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

const brandOnly = (req, res, next) => {
  if (req.user?.role !== 'brand') {
    return res.status(403).json({ error: 'Access denied. Brand accounts only.' });
  }
  next();
};

const influencerOnly = (req, res, next) => {
  if (req.user?.role !== 'influencer') {
    return res.status(403).json({ error: 'Access denied. Influencer accounts only.' });
  }
  next();
};

authenticate.brandOnly = brandOnly;
authenticate.influencerOnly = influencerOnly;

module.exports = authenticate;