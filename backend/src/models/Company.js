const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  industry: { type: String, default: '' },
  companySize: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  description: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  verified: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Company', companySchema);