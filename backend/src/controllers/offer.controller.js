const { Offer, Company, Application, Student, User } = require('../models');
const { createNotification } = require('../services/notification.service');
const { sendEmail } = require('../services/email.service');

exports.list = async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
      const offers = await Offer.find({ studentId: student._id })
        .populate('companyId', 'companyName industry location logoUrl')
        .populate('jobId', 'title type salaryMin salaryMax')
        .sort({ createdAt: -1 });
      const data = offers.map(o => ({
        _id: o._id, candidateName: o.candidateName, candidateEmail: o.candidateEmail,
        jobTitle: o.jobTitle || o.jobId?.title,
        companyName: o.companyId?.companyName || '',
        companyLogo: o.companyId?.logoUrl || '',
        companyIndustry: o.companyId?.industry || '',
        companyLocation: o.companyId?.location || '',
        salaryMin: o.salaryMin || o.jobId?.salaryMin,
        salaryMax: o.salaryMax || o.jobId?.salaryMax,
        status: o.status, sentDate: o.sentDate, expiryDate: o.expiryDate,
        acceptedDate: o.acceptedDate, rejectedDate: o.rejectedDate,
        notes: o.notes, createdAt: o.createdAt,
      }));
      return res.json({ success: true, data });
    }
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    const offers = await Offer.find({ companyId: company._id }).populate('jobId', 'title').sort({ createdAt: -1 });
    const data = offers.map(o => ({ _id: o._id, candidateName: o.candidateName, candidateEmail: o.candidateEmail, jobTitle: o.jobTitle || o.jobId?.title, salaryMin: o.salaryMin, salaryMax: o.salaryMax, status: o.status, sentDate: o.sentDate, expiryDate: o.expiryDate, acceptedDate: o.acceptedDate, notes: o.notes, createdAt: o.createdAt }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('studentId', 'userId course')
      .populate('companyId', 'companyName industry location logoUrl website')
      .populate('jobId', 'title description type salaryMin salaryMax location');
    if (!offer) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Offer not found.' } });
    
    // Student ownership check
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || offer.studentId?.toString() !== student._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'This offer does not belong to you.' } });
      }
    }
    
    // Company ownership check
    if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (!company || offer.companyId?.toString() !== company._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'This offer does not belong to your company.' } });
      }
    }
    
    res.json({ success: true, data: offer });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    const application = await Application.findById(req.body.applicationId).populate('studentId');
    if (!application) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    
    // Derive jobTitle from the job if not provided in the request
    let jobTitle = req.body.jobTitle;
    if (!jobTitle && req.body.jobId) {
      const Job = require('../models/Job');
      const job = await Job.findById(req.body.jobId).select('title');
      if (job) jobTitle = job.title;
    }
    
    const offer = await Offer.create({ 
      ...req.body, 
      companyId: company._id, 
      studentId: application.studentId?._id || application.studentId, // Always use application's studentId
      createdBy: req.user._id, 
      candidateName: req.body.candidateName || application.studentId?.name || 'Candidate',
      jobTitle: jobTitle || 'Position',
      status: 'Draft' 
    });
    await Application.findByIdAndUpdate(application._id, { status: 'Offered' });
    res.status(201).json({ success: true, data: offer, message: 'Offer created.' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    const offer = await Offer.findOneAndUpdate({ _id: req.params.id, companyId: company._id }, req.body, { new: true, runValidators: true });
    if (!offer) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Offer not found.' } });
    res.json({ success: true, data: offer, message: 'Offer updated.' });
  } catch (err) { next(err); }
};

exports.send = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    const offer = await Offer.findOneAndUpdate({ _id: req.params.id, companyId: company._id }, { status: 'Sent', sentDate: new Date(), expiryDate: req.body.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, { new: true });
    if (!offer) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Offer not found.' } });
    const student = await Student.findById(offer.studentId).populate('userId');
    if (student?.userId) {
      const studentUserId = student.userId._id || student.userId;
      await createNotification(studentUserId, 'Offer Received!', 'You have received an offer for ' + offer.jobTitle, 'success', '/student/applications');
      // Send email
      const studentUser = student.userId.name ? student.userId : await User.findById(studentUserId);
      if (studentUser && studentUser.email) {
        try {
          await sendEmail({
            to: studentUser.email,
            subject: 'Offer Received - ' + offer.jobTitle,
            html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Offer Received</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">Congratulations!</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">You have received an offer for <strong>' + offer.jobTitle + '</strong>.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux to review and accept your offer.</p></div></div>'
          });
        } catch (emailErr) {
          console.error('[Email] Failed to send offer email:', emailErr.message);
        }
      }
    }
    res.json({ success: true, data: offer, message: 'Offer sent to candidate.' });
  } catch (err) { next(err); }
};

exports.accept = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Offer not found.' } });
    
    // Student ownership verification
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || offer.studentId?.toString() !== student._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only accept your own offers.' } });
      }
    }
    
    if (offer.status !== 'Sent') return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Only sent offers can be accepted.' } });
    
    offer.status = 'Accepted'; offer.acceptedDate = new Date(); await offer.save();
    await Application.findByIdAndUpdate(offer.applicationId, { status: 'Accepted' });
    
    // Notify company
    const company = await Company.findById(offer.companyId);
    if (company) await createNotification(company.userId, 'Offer Accepted', offer.candidateName + ' has accepted the offer for ' + offer.jobTitle, 'success');
    
    // Send email to company
    const companyUser = await User.findById(company.userId);
    if (companyUser && companyUser.email) {
      try {
        await sendEmail({
          to: companyUser.email,
          subject: 'Offer Accepted - ' + offer.jobTitle,
          html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Offer Accepted</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + offer.candidateName + ' accepted your offer</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">The offer for <strong>' + offer.jobTitle + '</strong> has been accepted.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux for more details.</p></div></div>'
        });
      } catch (emailErr) {
        console.error('[Email] Failed to send offer accepted email:', emailErr.message);
      }
    }
    
    // Send placement confirmation email to student
    const placedStudent = await Student.findById(offer.studentId).populate('userId', 'name email');
    if (placedStudent && placedStudent.userId && placedStudent.userId.email) {
      try {
        await sendEmail({
          to: placedStudent.userId.email,
          subject: '🎉 Placement Confirmed - ' + offer.jobTitle,
          html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:white;font-size:28px;margin:0;">🎉 Congratulations!</h1></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:20px;margin:0 0 16px;">You&#39;re Placed!</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">Dear <strong>' + (placedStudent.userId.name || offer.candidateName) + '</strong>,</p><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">We are delighted to inform you that you have confirmed your placement for the position of <strong>' + offer.jobTitle + '</strong>.</p><p style="color:#6b7280;font-size:13px;margin:16px 0 0;">This is a significant achievement. We wish you the very best in your professional journey!</p><p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">— PlaceMux Team</p></div></div>'
        });
      } catch (emailErr) {
        console.error('[Email] Failed to send placement confirmation to student:', emailErr.message);
      }
    }
  } catch (err) { next(err); }
};

exports.reject = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Offer not found.' } });
    
    // Student ownership verification
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || offer.studentId?.toString() !== student._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only reject your own offers.' } });
      }
    }
    
    if (offer.status !== 'Sent') return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Only sent offers can be rejected.' } });
    
    offer.status = 'Rejected'; offer.rejectedDate = new Date(); await offer.save();
    await Application.findByIdAndUpdate(offer.applicationId, { status: 'Rejected' });
    
    // Notify company
    const company = await Company.findById(offer.companyId);
    if (company) await createNotification(company.userId, 'Offer Rejected', offer.candidateName + ' has rejected the offer for ' + offer.jobTitle, 'error');
    
    // Send email to company
    const companyUser = await User.findById(company.userId);
    if (companyUser && companyUser.email) {
      try {
        await sendEmail({
          to: companyUser.email,
          subject: 'Offer Rejected - ' + offer.jobTitle,
          html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Offer Rejected</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + offer.candidateName + ' rejected the offer</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">The offer for <strong>' + offer.jobTitle + '</strong> has been rejected.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux for more details.</p></div></div>'
        });
      } catch (emailErr) {
        console.error('[Email] Failed to send offer rejected email:', emailErr.message);
      }
    }
    
    res.json({ success: true, data: offer, message: 'Offer rejected.' });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    await Offer.findOneAndDelete({ _id: req.params.id, companyId: company._id });
    res.json({ success: true, message: 'Offer deleted.' });
  } catch (err) { next(err); }
};
