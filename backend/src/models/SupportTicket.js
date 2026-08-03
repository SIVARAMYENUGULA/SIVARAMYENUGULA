const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  category: {
    type: String,
    enum: ['Technical', 'Account', 'Assessment', 'Placement', 'General'],
    default: 'General',
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  adminReply: { type: String, default: '' },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  repliedAt: { type: Date },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  closedAt: { type: Date },
}, { timestamps: true });

supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
