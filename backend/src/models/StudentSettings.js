const mongoose = require('mongoose');

const studentSettingsSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    applicationUpdates: { type: Boolean, default: true },
    interviewReminders: { type: Boolean, default: true },
    assessmentReminders: { type: Boolean, default: true },
    jobAlerts: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
  },
  privacy: {
    showProfileToCompanies: { type: Boolean, default: true },
    showEmailToCompanies: { type: Boolean, default: false },
    showPhoneToCompanies: { type: Boolean, default: false },
    showResumePublicly: { type: Boolean, default: true },
    showSkillsPublicly: { type: Boolean, default: true },
  },
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
  },
}, { timestamps: true });

module.exports = mongoose.model('StudentSettings', studentSettingsSchema);
