const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user) => {
  return jwt.sign(
    { sub: user._id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { sub: user._id },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken };