const mongoose = require('mongoose');
const notifSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
notifSchema.index({ userId: 1, isRead: 1 });
notifSchema.index({ createdAt: -1 });
module.exports = mongoose.model('Notification', notifSchema);