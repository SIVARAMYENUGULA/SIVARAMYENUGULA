const mongoose = require('mongoose');
const sessionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'timed_out'], default: 'pending' },
  answers: [{ questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, selectedIndex: Number, isCorrect: Boolean, timeSpent: Number }],
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  startedAt: { type: Date },
  completedAt: { type: Date },
  timeTakenSec: { type: Number, default: 0 },
}, { timestamps: true });
sessionSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
sessionSchema.index({ studentId: 1 });
module.exports = mongoose.model('AssessmentSession', sessionSchema);