const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  points: { type: Number, default: 10 },
  orderIndex: { type: Number, required: true },
}, { timestamps: true });
questionSchema.index({ assessmentId: 1, orderIndex: 1 });
module.exports = mongoose.model('Question', questionSchema);