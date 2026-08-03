const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes
const env = require('../config/env');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.isDev ? 200 : 20, // 200 attempts in dev, 20 in production
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.isDev ? 50 : 5, // 50 signups in dev, 5 in production
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 password resets per hour
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many password reset attempts. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', signupLimiter, authController.register);
router.post('/signup', signupLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/forgot-password', passwordLimiter, authController.forgotPassword);
router.post('/reset-password', passwordLimiter, authController.resetPassword);

module.exports = router;