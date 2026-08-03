const mongoose = require('mongoose');
const scoreSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentSession', required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  assessmentTitle: String, assessmentType: String,
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: Boolean,
  grade: { type: String, enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'] },
  correctCount: Number, totalQuestions: Number, timeTakenSec: Number,
  completedAt: { type: Date },
}, { timestamps: true });
scoreSchema.index({ studentId: 1 });
scoreSchema.index({ completedAt: -1 });
module.exports = mongoose.model('Score', scoreSchema);