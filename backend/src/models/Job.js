const mongoose = require('mongoose');
const jobSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, default: '' },
  type: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], required: true },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  salaryCurrency: { type: String, default: 'INR' },
  skillsRequired: [{ type: String, trim: true }],
  applicantsCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'draft' },
  postedAt: { type: Date, default: Date.now },
  deadline: { type: Date },
}, { timestamps: true });
jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ skillsRequired: 1 });
module.exports = mongoose.model('Job', jobSchema);