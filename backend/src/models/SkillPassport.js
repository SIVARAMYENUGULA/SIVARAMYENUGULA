const mongoose = require('mongoose');
const skillSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  skills: [{ name: String, category: { type: String, enum: ['Frontend', 'Backend', 'AI/ML', 'Database', 'DevOps', 'Other'] }, level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] }, endorsements: { type: Number, default: 0 }, assessedAt: Date }],
  overallScore: { type: Number, default: 0 },
  lastUpdated: { type: Date },
}, { timestamps: true });
module.exports = mongoose.model('SkillPassport', skillSchema);