const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  assignedAt: { type: Date, default: Date.now },
  deadline: { type: Date, default: null },
  status: { type: String, enum: ['assigned', 'in_progress', 'completed', 'expired'], default: 'assigned' },
  notified: { type: Boolean, default: false },
}, { timestamps: true });

assignmentSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
assignmentSchema.index({ studentId: 1, status: 1 });
assignmentSchema.index({ companyId: 1 });

module.exports = mongoose.model('AssessmentAssignment', assignmentSchema);
