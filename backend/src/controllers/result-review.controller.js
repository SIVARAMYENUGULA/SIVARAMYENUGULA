const { Score, Assessment, Student, Company, AssessmentSession } = require('../models');

exports.companyResults = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });

    const { assessmentId } = req.query;
    const filter = {};
    if (assessmentId) filter.assessmentId = assessmentId;

    // Find all assessments created by this company
    const assessments = await Assessment.find({ createdBy: req.user._id }).select('_id title type');
    const assessmentIds = assessments.map(a => a._id);
    filter.assessmentId = { $in: assessmentIds };

    const results = await Score.find(filter)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'assessmentId', select: 'title type maxScore passingScore' })
      .sort({ completedAt: -1 });

    res.json({ success: true, data: { results, assessments } });
  } catch (err) { next(err); }
};

exports.studentAssessmentResult = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });

    const { studentId, assessmentId } = req.params;
    const score = await Score.findOne({ studentId, assessmentId })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'assessmentId', select: 'title type maxScore passingScore' });

    if (!score) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Result not found.' } });

    // Get proctoring summary
    const { getSessionRiskSummary } = require('../services/integrity.service');
    let integrity = null;
    if (score.sessionId) {
      integrity = await getSessionRiskSummary(score.sessionId);
    }

    res.json({ success: true, data: { score, integrity } });
  } catch (err) { next(err); }
};
