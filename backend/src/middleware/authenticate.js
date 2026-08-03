const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'Access denied. No token provided.' } });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_USER', message: 'User not found or deactivated.' } });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Token expired.' } });
    }
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token.' } });
  }
};