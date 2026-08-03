const crypto = require('crypto');
const { Otp } = require('../models');
const AppError = require('../utils/apiError');
const { sendEmail } = require('./email.service');

const generateOtp = async (email, type = 'email_verification') => {
  // Invalidate any previous unused OTPs
  await Otp.updateMany({ email, type, used: false }, { used: true });
  
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');
  
  await Otp.create({
    email,
    otp: hashedOtp,
    type,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });
  
  console.log(`[OTP] Generated for ${email}: ${otpCode}`);
  
  // Send OTP via email
  await sendEmail({
    to: email,
    subject: 'Your PlaceMux Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8f9fa; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">PlaceMux</h1>
          <p style="color: #6b7280; margin: 4px 0 0 0;">Placement Platform</p>
        </div>
        <div style="background: white; border-radius: 8px; padding: 24px; text-align: center;">
          <h2 style="color: #1a1a2e; font-size: 18px; margin: 0 0 16px;">Email Verification</h2>
          <p style="color: #4b5563; font-size: 14px; margin: 0 0 20px;">Your verification code is:</p>
          <div style="background: #1a1a2e; color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; margin: 0 auto 20px; display: inline-block;">${otpCode}</div>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">This code expires in 10 minutes.</p>
        </div>
      </div>
    `,
  });
  
  return { message: 'OTP sent successfully.' };
};

const verifyOtp = async (email, otpCode, type = 'email_verification') => {
  const otpRecord = await Otp.findOne({
    email,
    type,
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  
  if (!otpRecord) throw new AppError(400, 'NO_OTP', 'No valid OTP found. Please request a new one.');
  
  otpRecord.attempts += 1;
  
  if (otpRecord.attempts > 5) {
    otpRecord.used = true;
    await otpRecord.save();
    throw new AppError(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts. Please request a new OTP.');
  }
  
  const hashedInput = crypto.createHash('sha256').update(otpCode).digest('hex');
  if (otpRecord.otp !== hashedInput) {
    await otpRecord.save();
    throw new AppError(400, 'INVALID_OTP', 'Invalid OTP code.');
  }
  
  otpRecord.used = true;
  await otpRecord.save();
  
  return { message: 'OTP verified successfully.' };
};

module.exports = { generateOtp, verifyOtp };
