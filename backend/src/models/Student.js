const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
  course: { type: String, default: '' },
  year: { type: Number, min: 1, max: 6 },
  phone: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  profileCompleted: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });
module.exports = mongoose.model('Student', studentSchema);