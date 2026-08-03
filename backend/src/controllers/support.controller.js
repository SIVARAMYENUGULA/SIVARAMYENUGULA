const { SupportTicket, Student, User } = require('../models');
const { sendEmail } = require('../services/email.service');

exports.create = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    const { subject, message, category, priority } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Subject and message are required.' } });
    }
    const ticket = await SupportTicket.create({
      studentId: student._id,
      userId: req.user._id,
      subject,
      message,
      category: category || 'General',
      priority: priority || 'Medium',
    });
    
    // Notify admin about new ticket
    const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (admin && admin.email) {
      try {
        await sendEmail({
          to: admin.email,
          subject: 'New Support Ticket - ' + subject,
          html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Support Ticket</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + subject + '</h2><p style="color:#6b7280;font-size:13px;margin:0 0 12px;padding:12px;background:#f3f4f6;border-radius:6px;">' + message + '</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux to reply to this ticket.</p></div></div>'
        });
      } catch (emailErr) {
        console.error('[Email] Failed to send new ticket email:', emailErr.message);
      }
    }
    
    res.status(201).json({ success: true, data: ticket, message: 'Support ticket created.' });
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) filter.userId = req.user._id;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const tickets = await SupportTicket.find(filter)
      .populate('studentId', 'course year')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('studentId', 'course year')
      .populate('userId', 'name email');
    if (!ticket) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

exports.reply = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Reply message is required.' } });
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    ticket.adminReply = message;
    ticket.repliedBy = req.user._id;
    ticket.repliedAt = new Date();
    ticket.status = 'In Progress';
    await ticket.save();
    
    // Send email notification to student
    const studentUser = await User.findById(ticket.userId);
    if (studentUser && studentUser.email) {
      try {
        await sendEmail({
          to: studentUser.email,
          subject: 'Support Ticket Reply - ' + ticket.subject,
          html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Support Ticket Update</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + ticket.subject + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">Your support ticket has received a reply.</p><p style="color:#6b7280;font-size:13px;margin:0 0 12px;padding:12px;background:#f3f4f6;border-radius:6px;">' + message + '</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux to view the full conversation.</p></div></div>'
        });
      } catch (emailErr) {
        console.error('[Email] Failed to send support reply email:', emailErr.message);
      }
    }
    
    res.json({ success: true, data: ticket, message: 'Reply sent.' });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Invalid status.' } });
    }
    const updateData = { status };
    if (status === 'Closed' || status === 'Resolved') {
      updateData.closedBy = req.user._id;
      updateData.closedAt = new Date();
    }
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!ticket) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });
    
    // Send email to student when ticket is closed or resolved
    if ((status === 'Closed' || status === 'Resolved') && ticket.userId) {
      const studentUser = await User.findById(ticket.userId);
      if (studentUser && studentUser.email) {
        try {
          await sendEmail({
            to: studentUser.email,
            subject: 'Support Ticket ' + status + ' - ' + ticket.subject,
            html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Support Ticket ' + status + '</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + ticket.subject + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">Your support ticket has been marked as <strong>' + status + '</strong>.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux to view the full conversation.</p></div></div>'
          });
        } catch (emailErr) {
          console.error('[Email] Failed to send ticket status email:', emailErr.message);
        }
      }
    }
    
    res.json({ success: true, data: ticket, message: 'Ticket status updated.' });
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const total = await SupportTicket.countDocuments();
    const open = await SupportTicket.countDocuments({ status: 'Open' });
    const inProgress = await SupportTicket.countDocuments({ status: 'In Progress' });
    const resolved = await SupportTicket.countDocuments({ status: 'Resolved' });
    const closed = await SupportTicket.countDocuments({ status: 'Closed' });
    res.json({ success: true, data: { total, open, inProgress, resolved, closed } });
  } catch (err) { next(err); }
};
