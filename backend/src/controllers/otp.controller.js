const otpService = require('../services/otp.service');
const { User } = require('../models');

exports.sendOtp = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    if (!email) return res.status(400).json({ success: false, error: { code: 'MISSING_EMAIL', message: 'Email is required.' } });
    const result = await otpService.generateOtp(email, type || 'email_verification');
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, type } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Email and OTP are required.' } });
    const result = await otpService.verifyOtp(email, otp, type || 'email_verification');
    
    // If this is email verification, mark user as verified
    if (!type || type === 'email_verification') {
      await User.findOneAndUpdate({ email }, { isVerified: true });
    }
    
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    if (!email) return res.status(400).json({ success: false, error: { code: 'MISSING_EMAIL', message: 'Email is required.' } });
    const result = await otpService.generateOtp(email, type || 'email_verification');
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
