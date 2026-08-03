const { Drive, College, Student, Application, Company, User } = require('../models');
const { createNotification } = require('../services/notification.service');
const { sendEmail } = require('../services/email.service');

exports.list = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const drives = await Drive.find({ collegeId: college._id })
      .populate('companyId', 'companyName industry location logoUrl')
      .populate('jobId', 'title type salaryMin salaryMax')
      .sort({ createdAt: -1 });
    const data = drives.map(d => ({
      _id: d._id, name: d.name, description: d.description,
      company: d.companyId || {},
      job: d.jobId || {},
      eligibility: d.eligibility,
      stages: d.stages,
      status: d.status, startDate: d.startDate, endDate: d.endDate,
      registeredCount: d.registeredStudents?.length || 0,
      shortlistedCount: d.shortlistedStudents?.length || 0,
      selectedCount: d.selectedStudents?.length || 0,
      createdAt: d.createdAt,
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id)
      .populate('companyId', 'companyName industry location logoUrl website')
      .populate('jobId', 'title description type salaryMin salaryMax location skillsRequired')
      .populate('registeredStudents').populate('shortlistedStudents').populate('selectedStudents');
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found.' } });
    res.json({ success: true, data: drive });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const drive = await Drive.create({ ...req.body, collegeId: college._id, createdBy: req.user._id });
    const populated = await Drive.findById(drive._id).populate('companyId', 'companyName').populate('jobId', 'title');
    res.status(201).json({ success: true, data: populated, message: 'Drive created.' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const drive = await Drive.findOneAndUpdate(
      { _id: req.params.id, collegeId: college._id }, req.body,
      { new: true, runValidators: true }
    ).populate('companyId', 'companyName').populate('jobId', 'title');
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found.' } });
    res.json({ success: true, data: drive, message: 'Drive updated.' });
  } catch (err) { next(err); }
};

exports.publish = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const drive = await Drive.findOneAndUpdate(
      { _id: req.params.id, collegeId: college._id },
      { status: 'published', startDate: new Date() },
      { new: true }
    ).populate('companyId', 'companyName').populate('jobId', 'title');
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found.' } });
    const students = await Student.find({ collegeId: college._id }).populate('userId');
    for (const s of students) {
      if (s.userId) {
        const sUserId = s.userId._id || s.userId;
        await createNotification(sUserId, 'New Drive: ' + drive.name, 'A new placement drive has been published. Check eligibility and apply.', 'info', '/student/jobs');
        // Send email
        const studentUser = s.userId.email ? s.userId : await User.findById(sUserId);
        if (studentUser && studentUser.email) {
          try {
            await sendEmail({
              to: studentUser.email,
              subject: 'New Drive Published - ' + drive.name,
              html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">New Placement Drive</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + drive.name + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">A new placement drive has been published by your college.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux to check eligibility and apply.</p></div></div>'
            });
          } catch (emailErr) {
            console.error('[Email] Failed to send drive publish email:', emailErr.message);
          }
        }
      }
    }
    res.json({ success: true, data: drive, message: 'Drive published. Students notified.' });
  } catch (err) { next(err); }
};

exports.advanceStage = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const drive = await Drive.findOne({ _id: req.params.id, collegeId: college._id });
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found.' } });
    const currentIdx = drive.stages.findIndex(s => s.status === 'active');
    if (currentIdx === -1) return res.status(400).json({ success: false, error: { code: 'NO_ACTIVE_STAGE', message: 'No active stage found.' } });
    drive.stages[currentIdx].status = 'completed';
    drive.stages[currentIdx].completedAt = new Date();
    if (currentIdx + 1 < drive.stages.length) {
      drive.stages[currentIdx + 1].status = 'active';
    } else {
      drive.status = 'completed';
    }
    await drive.save();
    res.json({ success: true, data: drive, message: 'Stage advanced.' });
  } catch (err) { next(err); }
};

exports.getEligibleStudents = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const drive = await Drive.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found.' } });
    const { branches, skills, onlyUnplaced } = drive.eligibility || {};
    let filter = { collegeId: college._id };
    if (branches && branches.length > 0) filter.course = { $in: branches };
    let students = await Student.find(filter).populate('userId', 'name email avatar');
    let results = [];
    for (const s of students) {
      let eligible = true; let reasons = [];
      if (onlyUnplaced) {
        const acceptedApp = await Application.findOne({ studentId: s._id, status: 'Accepted' });
        if (acceptedApp) { eligible = false; reasons.push('Already placed'); }
      }
      if (eligible && skills && skills.length > 0) {
        const SkillPassport = require('../models/SkillPassport');
        const passport = await SkillPassport.findOne({ studentId: s._id });
        if (passport) {
          const studentSkills = passport.skills.map(sk => sk.name?.toLowerCase());
          const missing = skills.filter(sk => !studentSkills.includes(sk.toLowerCase()));
          if (missing.length > 0) { eligible = false; reasons.push('Missing skills: ' + missing.join(', ')); }
        } else { eligible = false; reasons.push('No skill passport'); }
      }
      results.push({ student: { _id: s._id, name: s.userId?.name || 'Unknown', email: s.userId?.email || '', avatar: s.userId?.avatar || '', course: s.course, year: s.year }, eligible, reasons });
    }
    results.sort((a, b) => (a.eligible === b.eligible ? 0 : a.eligible ? -1 : 1));
    res.json({ success: true, data: { eligible: results.filter(r => r.eligible).length, total: results.length, students: results } });
  } catch (err) { next(err); }
};

exports.registerStudents = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const { studentIds } = req.body;
    const drive = await Drive.findOneAndUpdate(
      { _id: req.params.id, collegeId: college._id },
      { $addToSet: { registeredStudents: { $each: studentIds } } },
      { new: true }
    );
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found.' } });
    const students = await Student.find({ _id: { $in: studentIds } }).populate('userId');
    for (const s of students) {
      if (s.userId) {
        const sUserId = s.userId._id || s.userId;
        await createNotification(sUserId, 'Registered for ' + drive.name, 'You have been registered for the placement drive. Prepare well!', 'success');
        // Send email
        const studentUser = s.userId.email ? s.userId : await User.findById(sUserId);
        if (studentUser && studentUser.email) {
          try {
            await sendEmail({
              to: studentUser.email,
              subject: 'Drive Registration Confirmed - ' + drive.name,
              html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Registration Confirmed</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + drive.name + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">You have been registered for the placement drive. Prepare well!</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux for more details.</p></div></div>'
            });
          } catch (emailErr) {
            console.error('[Email] Failed to send drive registration email:', emailErr.message);
          }
        }
      }
    }
    res.json({ success: true, data: drive, message: studentIds.length + ' students registered.' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// STUDENT-FACING ENDPOINTS
// ─────────────────────────────────────────────

/**
 * GET /drives/published
 * Student views all published drives for their college.
 */
exports.getPublishedDrives = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('collegeId');
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    
    const filter = { status: 'published' };
    if (student.collegeId) filter.collegeId = student.collegeId._id;
    
    const drives = await Drive.find(filter)
      .populate('companyId', 'companyName industry location logoUrl')
      .populate('jobId', 'title type salaryMin salaryMax location skillsRequired')
      .sort({ createdAt: -1 });
    
    const data = drives.map(d => ({
      _id: d._id, name: d.name, description: d.description,
      company: d.companyId || {},
      job: d.jobId || {},
      eligibility: d.eligibility,
      stages: d.stages,
      status: d.status, startDate: d.startDate, endDate: d.endDate,
      registeredCount: d.registeredStudents?.length || 0,
      isRegistered: d.registeredStudents?.some(s => s.toString() === student._id.toString()),
      createdAt: d.createdAt,
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * GET /drives/:id/check-eligibility
 * Student checks their eligibility for a specific drive.
 */
exports.checkEligibility = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'name email avatar');
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    
    const drive = await Drive.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found.' } });
    if (drive.status !== 'published') return res.status(400).json({ success: false, error: { code: 'NOT_PUBLISHED', message: 'Drive is not published.' } });
    
    const { branches, skills, onlyUnplaced, minCgpa } = drive.eligibility || {};
    let eligible = true;
    const reasons = [];
    
    // Check if already registered
    if (drive.registeredStudents?.some(s => s.toString() === student._id.toString())) {
      return res.json({ success: true, data: { eligible: true, alreadyRegistered: true, message: 'Already registered for this drive.' } });
    }
    
    // Check branch
    if (branches && branches.length > 0) {
      if (!branches.some(b => b.toLowerCase() === (student.course || '').toLowerCase())) {
        eligible = false; reasons.push('Your branch/course does not match eligibility criteria');
      }
    }
    
    // Check skills
    if (eligible && skills && skills.length > 0) {
      const SkillPassport = require('../models/SkillPassport');
      const passport = await SkillPassport.findOne({ studentId: student._id });
      if (passport && passport.skills) {
        const studentSkills = passport.skills.map(sk => sk.name?.toLowerCase());
        const matching = skills.filter(sk => studentSkills.includes(sk.toLowerCase()));
        if (matching.length === 0) {
          eligible = false; reasons.push('Your skills do not match the required skills');
        }
      }
    }
    
    // Check unplaced only
    if (eligible && onlyUnplaced) {
      const acceptedApp = await Application.findOne({ studentId: student._id, status: 'Accepted' });
      if (acceptedApp) { eligible = false; reasons.push('Only unplaced students are eligible'); }
    }
    
    res.json({ success: true, data: { eligible, reasons, student: { _id: student._id, name: student.userId?.name, email: student.userId?.email, course: student.course, year: student.year } } });
  } catch (err) { next(err); }
};

/**
 * POST /drives/:id/self-register
 * Student self-registers for a drive.
 */
exports.selfRegister = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    
    const drive = await Drive.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found.' } });
    if (drive.status !== 'published') return res.status(400).json({ success: false, error: { code: 'NOT_PUBLISHED', message: 'Drive is not published.' } });
    
    // Check if already registered
    if (drive.registeredStudents?.some(s => s.toString() === student._id.toString())) {
      return res.status(409).json({ success: false, error: { code: 'ALREADY_REGISTERED', message: 'Already registered for this drive.' } });
    }
    
    drive.registeredStudents.push(student._id);
    await drive.save();
    
    if (student.userId) {
      await createNotification(student.userId, 'Registered for ' + drive.name, 'You have successfully registered for the placement drive. Prepare well!', 'success', '/student/drives');
    }
    
    res.json({ success: true, data: { _id: drive._id, registeredCount: drive.registeredStudents.length }, message: 'Successfully registered for drive.' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// COMPANY-FACING ENDPOINTS
// ─────────────────────────────────────────────

/**
 * GET /drives/company
 * Company views drives that include their jobs.
 */
exports.getCompanyDrives = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    
    const drives = await Drive.find({ companyId: company._id })
      .populate('collegeId', 'collegeName location')
      .populate('jobId', 'title type salaryMin salaryMax')
      .populate('registeredStudents', 'userId')
      .sort({ createdAt: -1 });
    
    const data = drives.map(d => ({
      _id: d._id, name: d.name, description: d.description,
      college: d.collegeId || {},
      job: d.jobId || {},
      stages: d.stages,
      status: d.status, startDate: d.startDate, endDate: d.endDate,
      registeredCount: d.registeredStudents?.length || 0,
      shortlistedCount: d.shortlistedStudents?.length || 0,
      selectedCount: d.selectedStudents?.length || 0,
      createdAt: d.createdAt,
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * GET /drives/:id/candidates
 * Company views candidates registered for a drive.
 */
exports.getCandidates = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    
    const drive = await Drive.findOne({ _id: req.params.id, companyId: company._id });
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found or not associated with your company.' } });
    
    const registeredStudents = await Student.find({ _id: { $in: drive.registeredStudents } })
      .populate('userId', 'name email avatar');
    
    const shortlistedIds = (drive.shortlistedStudents || []).map(s => s.toString());
    const selectedIds = (drive.selectedStudents || []).map(s => s.toString());
    
    const candidates = registeredStudents.map(s => ({
      _id: s._id,
      name: s.userId?.name || 'Unknown',
      email: s.userId?.email || '',
      avatar: s.userId?.avatar || '',
      course: s.course, year: s.year,
      status: selectedIds.includes(s._id.toString()) ? 'selected' : shortlistedIds.includes(s._id.toString()) ? 'shortlisted' : 'registered',
    }));
    
    res.json({ success: true, data: candidates });
  } catch (err) { next(err); }
};

/**
 * POST /drives/:id/shortlist
 * Company shortlists students for a drive.
 */
exports.shortlistCandidates = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    
    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'studentIds array is required.' } });
    }
    
    const drive = await Drive.findOneAndUpdate(
      { _id: req.params.id, companyId: company._id },
      { $addToSet: { shortlistedStudents: { $each: studentIds } } },
      { new: true }
    );
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found or not associated with your company.' } });
    
    // Send notifications to shortlisted students
    const students = await Student.find({ _id: { $in: studentIds } }).populate('userId');
    for (const s of students) {
      if (s.userId) {
        const sUserId = s.userId._id || s.userId;
        await createNotification(sUserId, 'Shortlisted for ' + drive.name, 'Congratulations! You have been shortlisted. Next stage: ' + (drive.stages?.find(st => st.status === 'active')?.name || 'Assessment'), 'success', '/student/drives/' + drive._id);
        // Send email
        const studentUser = s.userId.email ? s.userId : await User.findById(sUserId);
        if (studentUser && studentUser.email) {
          try {
            await sendEmail({
              to: studentUser.email,
              subject: 'Shortlisted - ' + drive.name,
              html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Congratulations!</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">You have been shortlisted!</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">You have been shortlisted for <strong>' + drive.name + '</strong>. Next stage: ' + (drive.stages?.find(st => st.status === 'active')?.name || 'Assessment') + '.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux for more details.</p></div></div>'
            });
          } catch (emailErr) {
            console.error('[Email] Failed to send shortlist email:', emailErr.message);
          }
        }
      }
    }
    
    res.json({ success: true, data: { shortlistedCount: drive.shortlistedStudents.length }, message: studentIds.length + ' students shortlisted.' });
  } catch (err) { next(err); }
};

/**
 * POST /drives/:id/select
 * Company selects students for a drive (makes offer).
 */
exports.selectCandidates = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    
    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'studentIds array is required.' } });
    }
    
    const drive = await Drive.findOneAndUpdate(
      { _id: req.params.id, companyId: company._id },
      { $addToSet: { selectedStudents: { $each: studentIds } } },
      { new: true }
    );
    if (!drive) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Drive not found or not associated with your company.' } });
    
    // Send notifications to selected students
    const students = await Student.find({ _id: { $in: studentIds } }).populate('userId');
    for (const s of students) {
      if (s.userId) {
        const sUserId = s.userId._id || s.userId;
        await createNotification(sUserId, 'Selected for ' + drive.name, 'Congratulations! You have been selected. Offer details will be shared soon.', 'success', '/student/drives/' + drive._id);
        // Send email
        const studentUser = s.userId.email ? s.userId : await User.findById(sUserId);
        if (studentUser && studentUser.email) {
          try {
            await sendEmail({
              to: studentUser.email,
              subject: 'Selected - ' + drive.name,
              html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Selection Confirmed</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">Congratulations!</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">You have been selected for <strong>' + drive.name + '</strong>. Offer details will be shared soon.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux for more details.</p></div></div>'
            });
          } catch (emailErr) {
            console.error('[Email] Failed to send selection email:', emailErr.message);
          }
        }
      }
    }
    
    res.json({ success: true, data: { selectedCount: drive.selectedStudents.length }, message: studentIds.length + ' students selected.' });
  } catch (err) { next(err); }
};
