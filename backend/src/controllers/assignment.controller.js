const { AssessmentAssignment, Assessment, Student, Company, User, Score, College } = require('../models');
const { createNotification } = require('../services/notification.service');
const { sendEmail } = require('../services/email.service');

// Helper: auto-expire assignments past their deadline
const autoExpireAssignments = async (filter = {}) => {
  const now = new Date();
  const result = await AssessmentAssignment.updateMany(
    { ...filter, deadline: { $lt: now, $ne: null }, status: { $in: ['assigned', 'in_progress'] } },
    { $set: { status: 'expired' } }
  );
  return result.modifiedCount;
};

exports.assign = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });

    const { assessmentId, studentIds, deadline } = req.body;
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assessment not found.' } });

    const assignments = [];
    for (const studentId of studentIds) {
      const existing = await AssessmentAssignment.findOne({ assessmentId, studentId });
      if (existing) continue;

      const assignment = await AssessmentAssignment.create({
        assessmentId,
        studentId,
        companyId: company._id,
        deadline: deadline || null,
      });

      // Notify student
      const student = await Student.findById(studentId).populate('userId');
      if (student && student.userId) {
        await createNotification(
          student.userId._id || student.userId,
          'Assessment Assigned',
          'You have been assigned "' + assessment.title + '". Complete it before the deadline.',
          'info'
        );
        // Send email
        const user = student.userId._id ? student.userId : await User.findById(student.userId);
        if (user && user.email) {
          try {
            await sendEmail({
              to: user.email,
              subject: 'Assessment Assigned - ' + assessment.title,
              html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8f9fa;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="color:#1a1a2e;font-size:24px;margin:0;">PlaceMux</h1><p style="color:#6b7280;margin:4px 0 0;">Assessment Assigned</p></div><div style="background:white;border-radius:8px;padding:24px;text-align:center;"><h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;">' + assessment.title + '</h2><p style="color:#4b5563;font-size:14px;margin:0 0 8px;">You have been assigned an assessment by ' + (company.companyName || 'your company') + '.</p><p style="color:#9ca3af;font-size:12px;margin:0;">Log in to PlaceMux to start your assessment.</p></div></div>'
            });
          } catch (emailErr) {
            console.error('[Email] Failed to send assessment assigned email:', emailErr.message);
          }
        }
        assignment.notified = true;
        await assignment.save();
      }

      assignments.push(assignment);
    }

    res.status(201).json({ success: true, data: assignments, message: assignments.length + ' students assigned.' });
  } catch (err) { next(err); }
};

exports.myAssignments = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });

    const assignments = await AssessmentAssignment.find({ studentId: student._id })
      .populate({ path: 'assessmentId', select: 'title type duration description passingScore' })
      .populate({ path: 'companyId', select: 'companyName industry logoUrl' })
      .sort({ assignedAt: -1 });

    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
};

exports.companyAssignments = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });

    // Auto-expire past-due assignments
    await autoExpireAssignments({ companyId: company._id });

    const { assessmentId } = req.query;
    const filter = { companyId: company._id };
    if (assessmentId) filter.assessmentId = assessmentId;

    const assignments = await AssessmentAssignment.find(filter)
      .populate({ path: 'assessmentId', select: 'title type duration' })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .sort({ assignedAt: -1 });

    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const assignment = await AssessmentAssignment.findById(req.params.id)
      .populate({ path: 'assessmentId', select: 'title type duration description instructions passingScore' })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'companyId', select: 'companyName' });

    if (!assignment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found.' } });
    res.json({ success: true, data: assignment });
  } catch (err) { next(err); }
};

// ===== ASSIGNMENT ANALYTICS =====
exports.analytics = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });

    // Auto-expire past-due assignments
    await autoExpireAssignments({ companyId: company._id });

    const assignments = await AssessmentAssignment.find({ companyId: company._id })
      .populate({ path: 'assessmentId', select: 'title type' })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });

    const assignmentIds = assignments.map(a => a._id);
    const studentIds = [...new Set(
      assignments
        .filter(a => a.studentId)
        .map(a => a.studentId._id?.toString() || a.studentId.toString())
    )];
    const assessmentIds = [...new Set(
      assignments
        .filter(a => a.assessmentId)
        .map(a => a.assessmentId._id?.toString() || a.assessmentId.toString())
    )];

    // Get scores for completed assessments
    const scores = await Score.find({ assessmentId: { $in: assessmentIds }, studentId: { $in: studentIds } });

    // Status breakdown
    const totalAssignments = assignments.length;
    const assigned = assignments.filter(a => a.status === 'assigned').length;
    const inProgress = assignments.filter(a => a.status === 'in_progress').length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const expired = assignments.filter(a => a.status === 'expired').length;

    // Score analytics from completed
    const completedScores = scores.filter(s => s.passed !== undefined);
    const passedCount = completedScores.filter(s => s.passed).length;
    const completionRate = totalAssignments > 0 ? Math.round((completed / totalAssignments) * 100) : 0;
    const scoresPct = completedScores.map(s => s.percentage);
    const avgScore = scoresPct.length > 0 ? Math.round(scoresPct.reduce((a, b) => a + b, 0) / scoresPct.length) : 0;
    const highestScore = scoresPct.length > 0 ? Math.max(...scoresPct) : 0;
    const lowestScore = scoresPct.length > 0 ? Math.min(...scoresPct) : 0;

    // Top performers (top 10 by percentage)
    const validAssignments = assignments.filter(a => a.studentId);
    const topPerformers = await Promise.all(
      completedScores
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10)
        .map(async (s) => {
          const student = await Student.findById(s.studentId).populate('userId', 'name email');
          const assignment = validAssignments.find(a => a.studentId._id?.toString() === s.studentId.toString());
          return {
            studentName: student?.userId?.name || 'Unknown',
            studentEmail: student?.userId?.email || '',
            score: s.score,
            maxScore: s.maxScore,
            percentage: s.percentage,
            passed: s.passed,
            grade: s.grade,
            assessmentTitle: s.assessmentTitle,
            completedAt: s.completedAt,
            course: student?.course || '',
          };
        })
    );

    // Department (course) wise breakdown
    const deptMap = {};
    for (const s of completedScores) {
      const student = await Student.findById(s.studentId).populate('userId', 'name email');
      const course = student?.course || 'Unknown';
      if (!deptMap[course]) deptMap[course] = { course, total: 0, passed: 0, totalPct: 0, count: 0 };
      deptMap[course].total++;
      deptMap[course].totalPct += s.percentage;
      deptMap[course].count++;
      if (s.passed) deptMap[course].passed++;
    }
    const departmentBreakdown = Object.values(deptMap).map(d => ({
      ...d,
      avgScore: d.count > 0 ? Math.round(d.totalPct / d.count) : 0,
      passRate: d.total > 0 ? Math.round((d.passed / d.total) * 100) : 0,
    }));

    // Per-assessment breakdown
    const assessmentBreakdown = assignments.reduce((acc, a) => {
      const aid = a.assessmentId._id?.toString() || a.assessmentId.toString();
      if (!acc[aid]) {
        acc[aid] = {
          assessmentId: aid,
          assessmentTitle: a.assessmentId.title || 'Unknown',
          assessmentType: a.assessmentId.type || '',
          total: 0, completed: 0, inProgress: 0, expired: 0,
        };
      }
      acc[aid].total++;
      if (a.status === 'completed') acc[aid].completed++;
      else if (a.status === 'in_progress') acc[aid].inProgress++;
      else if (a.status === 'expired') acc[aid].expired++;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          totalAssignments,
          assigned,
          inProgress,
          completed,
          expired,
          completionRate,
          avgScore,
          highestScore,
          lowestScore,
          passedCount,
        },
        topPerformers,
        departmentBreakdown,
        assessmentBreakdown: Object.values(assessmentBreakdown),
      },
    });
  } catch (err) { next(err); }
};

// ===== CANDIDATE ASSESSMENT DETAIL (for a specific student) =====
exports.candidateAssessments = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });

    const { studentId } = req.params;

    const assignments = await AssessmentAssignment.find({ companyId: company._id, studentId })
      .populate({ path: 'assessmentId', select: 'title type duration passingScore' });

    const results = await Promise.all(
      assignments.map(async (a) => {
        const score = await Score.findOne({ assessmentId: a.assessmentId._id, studentId }).sort({ completedAt: -1 });
        const student = await Student.findById(studentId).populate('userId', 'name email');
        return {
          assignmentId: a._id,
          assessmentId: a.assessmentId._id,
          assessmentTitle: a.assessmentId.title,
          assessmentType: a.assessmentId.type,
          status: a.status,
          deadline: a.deadline,
          assignedAt: a.assignedAt,
          score: score?.score || null,
          maxScore: score?.maxScore || null,
          percentage: score?.percentage || null,
          percentile: null, // Calculated below
          grade: score?.grade || null,
          passed: score?.passed || null,
          completedAt: score?.completedAt || null,
        };
      })
    );

    // Calculate percentile for each result (scoped to company's own candidates)
    const companyStudentIds = await AssessmentAssignment.find({ companyId: company._id }).distinct('studentId');
    const companyScores = await Score.find({ studentId: { $in: companyStudentIds } });
    const resultsWithPercentile = results.map(r => {
      if (r.percentage !== null && companyScores.length > 0) {
        const belowCount = companyScores.filter(s => s.percentage < r.percentage).length;
        r.percentile = Math.round((belowCount / companyScores.length) * 100);
      }
      return r;
    });

    res.json({ success: true, data: resultsWithPercentile });
  } catch (err) { next(err); }
};
