const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, default: '' },
  jobTitle: { type: String, required: true },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  offerLetter: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'], default: 'Draft' },
  sentDate: { type: Date },
  expiryDate: { type: Date },
  acceptedDate: { type: Date },
  rejectedDate: { type: Date },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

offerSchema.index({ companyId: 1, status: 1 });
offerSchema.index({ studentId: 1 });

module.exports = mongoose.model('Offer', offerSchema);
