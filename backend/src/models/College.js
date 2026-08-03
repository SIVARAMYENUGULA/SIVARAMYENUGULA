const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  collegeName: { type: String, required: true },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  emailDomains: { type: [String], default: [], description: 'Email domains (e.g. college.edu, iitb.ac.in) used to auto-link student registrations to this college' },
  totalStudents: { type: Number, default: 0 },
  placementRate: { type: Number, default: 0 },
  averagePackage: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('College', collegeSchema);
