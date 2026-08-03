const mongoose = require('mongoose');
const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Technical', 'Aptitude', 'Soft Skills', 'Domain'], required: true },
  maxScore: { type: Number, default: 100 },
  duration: { type: Number, required: true },
  passingScore: { type: Number, default: 60 },
  description: { type: String, default: '' },
  instructions: { type: String, default: '' },
  questionCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Assessment', assessmentSchema);