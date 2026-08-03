const authService = require('../services/auth.service');
const crypto = require('crypto');
const { User } = require('../models');
const { sendEmail } = require('../services/email.service');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result, message: 'Registration successful.' });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result, message: 'Login successful.' });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshUserToken(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const { Student, Company, College, AdminProfile } = require('../models');
    let profile = null;
    if (req.user.role === 'student') profile = await Student.findOne({ userId: req.user._id }).populate('collegeId');
    else if (req.user.role === 'company') profile = await Company.findOne({ userId: req.user._id });
    else if (req.user.role === 'college') profile = await College.findOne({ userId: req.user._id });
    else if (req.user.role === 'admin') profile = await AdminProfile.findOne({ userId: req.user._id });
    res.json({ success: true, data: { user: req.user, profile } });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user._id, req.body);
    res.json({ success: true, data: result, message: 'Profile updated.' });
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    const frontendUrl = process.env.FRONTEND_URL || (process.env.CORS_ORIGIN || '').split(',')[0] || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Reset Your PlaceMux Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8f9fa; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">PlaceMux</h1>
            <p style="color: #6b7280; margin: 4px 0 0 0;">Password Reset</p>
          </div>
          <div style="background: white; border-radius: 8px; padding: 24px; text-align: center;">
            <h2 style="color: #1a1a2e; font-size: 18px; margin: 0 0 16px;">Reset Your Password</h2>
            <p style="color: #4b5563; font-size: 14px; margin: 0 0 20px;">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="background: #1a1a2e; color: #ffffff; font-size: 16px; font-weight: bold; padding: 12px 32px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a>
          </div>
        </div>
      `,
    });
    
    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired.' } });
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = null;
    await user.save();
    res.json({ success: true, message: 'Password reset successful. Please login with your new password.' });
  } catch (err) { next(err); }
};