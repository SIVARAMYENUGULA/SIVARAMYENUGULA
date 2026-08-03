const mongoose = require('mongoose');

const driveStageSchema = new mongoose.Schema({
  name: { type: String, enum: ['Registration', 'Assessment', 'Shortlisting', 'Interview', 'Offer', 'Closed'], required: true },
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
  completedAt: { type: Date },
  notes: { type: String, default: '' },
}, { _id: false });

const eligibilitySchema = new mongoose.Schema({
  branches: [{ type: String }],
  minCgpa: { type: Number, min: 0, max: 10, default: 0 },
  minAssessmentScore: { type: Number, default: 0 },
  skills: [{ type: String }],
  graduationYears: [{ type: Number }],
  maxBacklogs: { type: Number, default: 999 },
  onlyUnplaced: { type: Boolean, default: false },
}, { _id: false });

const driveSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  eligibility: { type: eligibilitySchema, default: () => ({}) },
  stages: { 
    type: [driveStageSchema], 
    default: [
      { name: 'Registration', status: 'active' },
      { name: 'Assessment', status: 'pending' },
      { name: 'Shortlisting', status: 'pending' },
      { name: 'Interview', status: 'pending' },
      { name: 'Offer', status: 'pending' },
      { name: 'Closed', status: 'pending' },
    ]
  },
  status: { type: String, enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'], default: 'draft' },
  startDate: { type: Date },
  endDate: { type: Date },
  registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  shortlistedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  selectedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

driveSchema.index({ collegeId: 1, status: 1 });
driveSchema.index({ companyId: 1 });

module.exports = mongoose.model('Drive', driveSchema);
