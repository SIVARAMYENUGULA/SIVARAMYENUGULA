const { Interview, Company, Student, User, Application } = require('../models');
const { createNotification, notifyInterviewScheduled } = require('../services/notification.service');
const { sendEmail } = require('../services/email.service');

exports.list = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      filter.companyId = company._id;
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      filter.studentId = student._id;
    }
    const interviews = await Interview.find(filter)
      .populate('companyId', 'companyName location')
      .populate('studentId')
      .populate('jobId', 'title')
      .sort({ date: -1 });
    res.json({ success: true, data: interviews });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('companyId', 'companyName location logoUrl')
      .populate('studentId')
      .populate('jobId', 'title');
    if (!interview) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Interview not found.' } });
    res.json({ success: true, data: interview });
  } catch (err) { next(err); }
};

exports.getUpcoming = async (req, res, next) => {
  try {
    let filter = { date: { $gte: new Date() }, status: { $ne: 'Cancelled' } };
    if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      filter.companyId = company._id;
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      filter.studentId = student._id;
    }
    const interviews = await Interview.find(filter)
      .populate('companyId', 'companyName location')
      .populate('studentId')
      .sort({ date: 1, time: 1 });
    res.json({ success: true, data: interviews });
  } catch (err) { next(err); }
};

exports.schedule = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    
    // Derive studentId from application if not provided directly
    if (!req.body.studentId && req.body.applicationId) {
      const application = await Application.findById(req.body.applicationId).populate('studentId');
      if (application && application.studentId) {
        req.body.studentId = application.studentId._id || application.studentId;
      }
    }
    
    const interview = await Interview.create({ ...req.body, companyId: company._id, scheduledBy: req.user._id });
    const student = await Student.findById(req.body.studentId);
    // In-app notification
    if (student) {
      await createNotification(
        student.userId, 'Interview Scheduled',
        'You have an interview for ' + req.body.jobTitle + ' on ' + new Date(req.body.date).toLocaleDateString() + ' at ' + req.body.time + '.',
        'info'
      );
    }
    
    // Email notification
    const notifyEmail = req.body.candidateEmail;
    const notifyName = req.body.candidateName || (student ? student.name : '');
    if (notifyEmail) {
      await notifyInterviewScheduled(notifyEmail, notifyName, req.body.jobTitle,
        new Date(req.body.date).toLocaleDateString(), req.body.time);
    } else if (student) {
      const studentUser = await User.findById(student.userId);
      if (studentUser && studentUser.email) {
        await notifyInterviewScheduled(studentUser.email, studentUser.name, req.body.jobTitle,
          new Date(req.body.date).toLocaleDateString(), req.body.time);
      }
    }
    
    res.status(201).json({ success: true, data: interview, message: 'Interview scheduled.' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (company) query.companyId = company._id;
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) query.studentId = student._id;
      // Students can only update date/time/status, not other fields
      const allowedFields = ['date', 'time', 'status'];
      Object.keys(req.body).forEach(k => {
        if (!allowedFields.includes(k)) delete req.body[k];
      });
    }
    const interview = await Interview.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!interview) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Interview not found.' } });
    
    // Send email to student if feedback or status update from company
    if (req.user.role === 'company' && (req.body.feedback || req.body.status)) {
      const student = await Student.findById(interview.studentId).populate('userId', 'name email');
      if (student && student.userId && student.userId.email) {
        try {
          const statusText = req.body.status || interview.status;
          await sendEmail({
            to: student.userId.email,
            subject: 'Interview ' + statusText + ' - ' + interview.jobTitle,
            html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Interview Update</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">Interview ' + statusText + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">Your interview for <strong>' + interview.jobTitle + '</strong> has been updated to: ' + statusText + '.</p>' + (req.body.feedback ? '<div style="background:#f3f4f6;border-radius:6px;padding:12px;margin:12px 0;"><p style="color:#374151;font-size:13px;margin:0;font-style:italic;">"' + req.body.feedback + '"</p></div>' : '') + '<p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux for more details.</p></div></div>'
          });
        } catch (emailErr) {
          console.error('[Email] Failed to send interview update email:', emailErr.message);
        }
      }
    }
    
    res.json({ success: true, data: interview, message: 'Interview updated.' });
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (company) query.companyId = company._id;
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) query.studentId = student._id;
    }
    const interview = await Interview.findOneAndUpdate(query, { status: 'Cancelled' }, { new: true });
    if (!interview) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Interview not found.' } });
    const student = await Student.findById(interview.studentId);
    if (student) {
      await createNotification(
        student.userId, 'Interview Cancelled',
        `Your interview for ${interview.jobTitle} has been cancelled.`,
        'warning'
      );
    }
    res.json({ success: true, data: interview, message: 'Interview cancelled.' });
  } catch (err) { next(err); }
};

exports.getStudentHistory = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    const interviews = await Interview.find({ studentId: student._id })
      .populate('companyId', 'companyName location logoUrl')
      .populate('jobId', 'title')
      .sort({ date: -1 });
    res.json({ success: true, data: interviews });
  } catch (err) { next(err); }
};
