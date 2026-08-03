const { Assessment, Question, AssessmentSession, Score, Student, Company, Application, User } = require('../models');
const assessmentService = require('../services/assessment.service');
const { sendEmail } = require('../services/email.service');

exports.list = async (req, res, next) => {
  try {
    let filter = { isActive: true };
    if (req.user.role === 'company' || req.user.role === 'admin') filter = {};
    const assessments = await Assessment.find(filter).select('-__v');
    res.json({ success: true, data: assessments });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assessment not found.' } });
    res.json({ success: true, data: assessment });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const assessment = await Assessment.create({ ...req.body, createdBy: req.user._id, isActive: true });
    res.status(201).json({ success: true, data: assessment, message: 'Assessment created.' });
  } catch (err) { next(err); }
};

exports.addQuestions = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assessment not found.' } });
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Questions array is required.' } });
    const questionDocs = questions.map((q, idx) => ({ assessmentId: assessment._id, questionText: q.questionText, options: q.options, correctIndex: q.correctIndex, points: q.points || 10, orderIndex: q.orderIndex || (idx + 1) }));
    const created = await Question.insertMany(questionDocs);
    assessment.questionCount = await Question.countDocuments({ assessmentId: assessment._id });
    await assessment.save();
    res.status(201).json({ success: true, data: created, message: 'Questions added.' });
  } catch (err) { next(err); }
};

exports.start = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });
    const result = await assessmentService.startAssessment(req.params.id, student._id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.submit = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });
    const result = await assessmentService.submitAssessment(req.params.id, student._id, req.body.answers);
    
    // Send email notification with result to student
    const user = await User.findById(req.user._id);
    if (user && user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Assessment Result - ' + (result.assessmentTitle || 'Assessment'),
          html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Assessment Result</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + (result.assessmentTitle || 'Assessment') + '</h2><p style="font-size:36px;font-weight:bold;color:' + (result.passed ? '#10b981' : '#ef4444') + ';margin:0 0 8px;">' + result.score + '/' + result.maxScore + '</p><p style="color:#4b5563;font-size:14px;margin:0 0 4px;">Percentage: ' + result.percentage + '%</p><p style="color:#4b5563;font-size:14px;margin:0 0 4px;">Grade: ' + result.grade + '</p><p style="color:#4b5563;font-size:14px;margin:0;">Result: ' + (result.passed ? 'PASSED' : 'FAILED') + '</p></div></div>'
        });
      } catch (emailErr) {
        console.error('[Email] Failed to send assessment result email:', emailErr.message);
      }
    }
    
    // Send email to the company that created this assessment when student completes it
    const assessmentDoc = await Assessment.findById(req.params.id);
    if (assessmentDoc && assessmentDoc.createdBy) {
      const company = await Company.findOne({ userId: assessmentDoc.createdBy }).populate('userId', 'email name');
      if (company && company.userId && company.userId.email) {
        try {
          await sendEmail({
            to: company.userId.email,
            subject: 'Assessment Completed - ' + (result.assessmentTitle || 'Assessment'),
            html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Assessment Completed</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + (result.assessmentTitle || 'Assessment') + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;"><strong>' + user.name + '</strong> has completed ' + (result.assessmentTitle || 'the assessment') + '.</p><p style="color:#4b5563;font-size:14px;margin:0;">Score: ' + result.score + '/' + result.maxScore + ' (' + result.percentage + '%) | ' + (result.passed ? 'PASSED' : 'FAILED') + '</p><p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">Log in to PlaceMux to view detailed results.</p></div></div>'
          });
        } catch (emailErr) {
          console.error('[Email] Failed to send assessment completed email to company:', emailErr.message);
        }
      }
    }
    
    res.json({ success: true, data: result, message: 'Assessment submitted.' });
  } catch (err) { next(err); }
};

exports.results = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });
    const score = await Score.findOne({ assessmentId: req.params.id, studentId: student._id }).sort({ completedAt: -1 });
    if (!score) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No results found.' } });
    res.json({ success: true, data: score });
  } catch (err) { next(err); }
};

exports.history = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });
    const scores = await Score.find({ studentId: student._id }).sort({ completedAt: -1 });
    res.json({ success: true, data: scores });
  } catch (err) { next(err); }
};

// Company can get all scores for their job applications and directly assigned assessments
exports.companyResults = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    
    // 1) Get assessments created BY this company (directly assigned)
    const companyAssessments = await Assessment.find({ createdBy: req.user._id }).select('_id title type');
    const companyAssessmentIds = companyAssessments.map(a => a._id);
    
    // 2) Also get assessments linked via job applications
    const companyJobs = await (require('../models/Job')).find({ companyId: company._id }).select('_id');
    const jobIds = companyJobs.map(j => j._id);
    const applications = await Application.find({ jobId: { $in: jobIds }, status: { $ne: 'Applied' } }).select('studentId');
    const studentIdsFromApps = [...new Set(applications.map(a => a.studentId.toString()))];
    
    // 3) Get scores: from direct assignments AND from application-linked students
    // Get scores where assessment was created by company
    const directScores = companyAssessmentIds.length > 0 
      ? await Score.find({ assessmentId: { $in: companyAssessmentIds } })
          .populate('studentId', 'userId course')
          .populate('assessmentId', 'title type')
          .sort({ percentage: -1 })
      : [];
    
    // Get scores for application-linked students
    const appLinkedScores = studentIdsFromApps.length > 0
      ? await Score.find({ studentId: { $in: studentIdsFromApps } })
          .populate('studentId', 'userId course')
          .populate('assessmentId', 'title type')
          .sort({ percentage: -1 })
      : [];
    
    // Combine unique scores by _id
    const scoreMap = new Map();
    for (const s of [...directScores, ...appLinkedScores]) {
      if (!scoreMap.has(s._id.toString())) scoreMap.set(s._id.toString(), s);
    }
    
    const data = [];
    for (const s of scoreMap.values()) {
      const student = await Student.findById(s.studentId?._id || s.studentId).populate('userId', 'name email');
      if (student) {
        data.push({ _id: s._id, studentName: student.userId?.name || 'Unknown', studentEmail: student.userId?.email || '', course: student.course || '', assessmentTitle: s.assessmentTitle || s.assessmentId?.title || 'Unknown', score: s.score, maxScore: s.maxScore, percentage: s.percentage, passed: s.passed, grade: s.grade, completedAt: s.completedAt });
      }
    }
    const totalStudents = data.length;
    const passedCount = data.filter(d => d.passed).length;
    const passRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;
    const avgScore = totalStudents > 0 ? Math.round(data.reduce((s, d) => s + d.percentage, 0) / totalStudents) : 0;
    res.json({ success: true, data: { results: data, summary: { totalStudents, passedCount, passRate, avgScore } } });
  } catch (err) { next(err); }
};

// Assign assessment to students
exports.assignToStudents = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    const { studentIds } = req.body;
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assessment not found.' } });
    const { AssessmentAssignment } = require('../models');
    const created = [];
    for (const studentId of studentIds) {
      const existing = await AssessmentAssignment.findOne({ assessmentId: assessment._id, studentId });
      if (!existing) {
        const assignment = await AssessmentAssignment.create({ assessmentId: assessment._id, studentId, companyId: company._id, assignedBy: req.user._id });
        created.push(assignment);
        const student = await Student.findById(studentId).populate('userId', '_id');
        if (student?.userId) {
          const { createNotification } = require('../services/notification.service');
          await createNotification(student.userId._id, 'Assessment Assigned', 'You have been assigned: ' + assessment.title, 'info', '/student/assessments');
        }
      }
    }
    // Also update application statuses
    if (req.body.applicationIds) {
      await Application.updateMany({ _id: { $in: req.body.applicationIds } }, { status: 'Assessment Assigned' });
    }
    res.json({ success: true, data: created, message: created.length + ' students assigned.' });
  } catch (err) { next(err); }
};
