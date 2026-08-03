const mongoose = require('mongoose');
const auditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  resource: { type: String, default: '' },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
auditSchema.index({ userId: 1 });
auditSchema.index({ action: 1 });
auditSchema.index({ createdAt: -1 });
module.exports = mongoose.model('AuditLog', auditSchema);