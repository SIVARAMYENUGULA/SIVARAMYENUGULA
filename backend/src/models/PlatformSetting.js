const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema({
  platformName: { type: String, default: 'PlaceMux' },
  supportEmail: { type: String, default: 'support@placemux.com' },
  sessionTimeout: { type: Number, default: 60 },
  maxLoginAttempts: { type: Number, default: 5 },
  passwordMinLength: { type: Number, default: 8 },
  smtpHost: { type: String, default: '' },
  smtpPort: { type: Number, default: 587 },
  fromEmail: { type: String, default: 'noreply@placemux.com' },
  fromName: { type: String, default: 'PlaceMux' },
  defaultLanguage: { type: String, default: 'en' },
  timezone: { type: String, default: 'IST (UTC+5:30)' },
  twoFARequired: { type: String, default: 'disabled' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
