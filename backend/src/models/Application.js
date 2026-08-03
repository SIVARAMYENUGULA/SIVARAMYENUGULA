const mongoose = require('mongoose');
const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['Applied', 'Shortlisted', 'Assessment Assigned', 'Assessment Completed', 'Interview', 'Offered', 'Accepted', 'Rejected'], default: 'Applied' },
  resumeUrl: { type: String, default: '' },
  coverLetter: { type: String, default: '' },
  additionalInfo: { type: mongoose.Schema.Types.Mixed },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });
applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
applicationSchema.index({ studentId: 1 });
applicationSchema.index({ status: 1 });
module.exports = mongoose.model('Application', applicationSchema);