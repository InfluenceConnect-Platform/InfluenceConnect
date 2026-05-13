const requiresPremium = async (req, res, next) => {
  try {
    const user = req.user;

    const isPremium = user.plan === 'premium' && 
                      user.premiumUntil && 
                      user.premiumUntil > new Date();

    if (!isPremium) {
      return res.status(403).json({
        error: 'premium_required',
        message: 'This feature requires a Premium subscription.'
      });
    }

    next();

  } catch (error) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

module.exports = requiresPremium;