const { Application, Job, Student, Company, User } = require('../models');
const { notifyApplicationUpdate } = require('../services/notification.service');
const { sendEmail } = require('../services/email.service');

exports.submit = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    
    const existing = await Application.findOne({ jobId: req.body.jobId, studentId: student._id });
    if (existing) return res.status(409).json({ success: false, error: { code: 'ALREADY_APPLIED', message: 'Already applied.' } });
    
    const job = await Job.findById(req.body.jobId).populate('companyId');
    if (!job) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found.' } });
    
    const application = await Application.create({ ...req.body, studentId: student._id });
    await Job.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } });
    
    // FIX: Use job.companyId populated to get company name
    const companyName = job.companyId ? (job.companyId.companyName || job.companyId.name || 'Company') : 'Company';
    await notifyApplicationUpdate(student.userId, job.title, companyName, 'Applied');
    
    // Send email to student confirming application submitted
    if (req.user && req.user.email) {
      try {
        await sendEmail({
          to: req.user.email,
          subject: 'Application Submitted - ' + job.title,
          html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Application Submitted</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">Application Received!</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">Your application for <strong>' + job.title + '</strong> at <strong>' + companyName + '</strong> has been submitted successfully.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux to track your application status.</p></div></div>'
        });
      } catch (emailErr) {
        console.error('[Email] Failed to send application confirmation to student:', emailErr.message);
      }
    }
    
    // Send email to company about new applicant
    if (job.companyId && job.companyId.userId) {
      const companyUser = await User.findById(job.companyId.userId);
      if (companyUser && companyUser.email) {
        try {
          await sendEmail({
            to: companyUser.email,
            subject: 'New Application Received - ' + job.title,
            html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">New Application</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">New Applicant for ' + job.title + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;"><strong>' + req.user.name + '</strong> has applied for <strong>' + job.title + '</strong>.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux to review the application.</p></div></div>'
          });
        } catch (emailErr) {
          console.error('[Email] Failed to send new application email to company:', emailErr.message);
        }
      }
    }
    
    res.status(201).json({ success: true, data: application, message: 'Application submitted.' });
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    let filter = {};
    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      filter.studentId = student._id;
    } else if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      const jobs = await Job.find({ companyId: company._id }).select('_id');
      filter.jobId = { $in: jobs.map(j => j._id) };
    }
    
    const applications = await Application.find(filter)
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'companyName industry logoUrl location' } })
      .populate('studentId')
      .sort({ appliedAt: -1 });
    
    res.json({ success: true, data: applications });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'companyName industry logoUrl location' } })
      .populate('studentId');
    if (!application) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    res.json({ success: true, data: application });
  } catch (err) { next(err); }
};

exports.withdraw = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      query.studentId = student._id;
    } else if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      const companyJobs = await Job.find({ companyId: company._id }).select('_id');
      const jobIds = companyJobs.map(j => j._id);
      query.jobId = { $in: jobIds };
    }
    const application = await Application.findOneAndDelete(query);
    if (!application) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    await Job.findByIdAndUpdate(application.jobId, { $inc: { applicantsCount: -1 } });
    res.json({ success: true, message: 'Application withdrawn.' });
  } catch (err) { next(err); }
};

exports.getStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    const application = await Application.findOne({ jobId, studentId: student._id });
    res.json({ success: true, data: application || null });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id).populate({ path: 'jobId', populate: { path: 'companyId', select: 'companyName userId' } });
    if (!application) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    
    application.status = status;
    await application.save();
    
    const student = await Student.findById(application.studentId);
    // FIX: Use populated jobId.companyId for company name
    const companyName = application.jobId && application.jobId.companyId
      ? (application.jobId.companyId.companyName || 'Company')
      : 'Company';
    await notifyApplicationUpdate(student.userId, application.jobId.title, companyName, status);
    
    // Send email to student when shortlisted/interviewed
    if ((status === 'Shortlisted' || status === 'Interview' || status === 'Assessment Assigned') && student) {
      const studentUser = await User.findById(student.userId);
      if (studentUser && studentUser.email) {
        try {
          await sendEmail({
            to: studentUser.email,
            subject: 'Application ' + status + ' - ' + application.jobId.title,
            html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Application Update</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">Application ' + status + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">Your application for <strong>' + application.jobId.title + '</strong> at <strong>' + companyName + '</strong> has been updated to <strong>' + status + '</strong>.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux for more details.</p></div></div>'
          });
        } catch (emailErr) {
          console.error('[Email] Failed to send application status email to student:', emailErr.message);
        }
      }
    }
    
    // Also send email to company about status change
    const companyUserId = application.jobId?.companyId?.userId;
    if (companyUserId) {
      const companyUser = await User.findById(companyUserId);
      if (companyUser && companyUser.email) {
        try {
          await sendEmail({
            to: companyUser.email,
            subject: 'Application ' + status + ' - ' + application.jobId.title,
            html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Application Update</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + status + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">A candidate\'s application for <strong>' + application.jobId.title + '</strong> has been updated to ' + status + '.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux for more details.</p></div></div>'
          });
        } catch (emailErr) {
          console.error('[Email] Failed to send application status email to company:', emailErr.message);
        }
      }
    }
    
    res.json({ success: true, data: application, message: `Status updated to ${status}.` });
  } catch (err) { next(err); }
};