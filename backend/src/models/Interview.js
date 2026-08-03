const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, default: '' },
  candidateAvatar: { type: String, default: '' },
  jobTitle: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 60 },
  type: { type: String, enum: ['Technical', 'HR', 'Cultural', 'Final'], required: true },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'], default: 'Scheduled' },
  notes: { type: String, default: '' },
  feedback: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5 },
  scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  meetingLink: { type: String, default: '' },
}, { timestamps: true });

interviewSchema.index({ companyId: 1 });
interviewSchema.index({ studentId: 1 });
interviewSchema.index({ date: -1 });
interviewSchema.index({ status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
