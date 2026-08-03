const { calculateIntegrityScore, getSessionRiskSummary } = require('../services/integrity.service');
const { ProctoringEvent, AssessmentSession, Assessment } = require('../models');

exports.getSessionIntegrity = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await getSessionRiskSummary(sessionId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.getAssessmentIntegrity = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const sessions = await AssessmentSession.find({ assessmentId });
    
    const integrityData = await Promise.all(
      sessions.map(async (session) => {
        const integrity = await getSessionRiskSummary(session._id);
        return {
          sessionId: session._id,
          studentId: session.studentId,
          score: session.score,
          percentage: session.percentage,
          integrity,
        };
      })
    );

    const averageIntegrity = integrityData.length > 0
      ? Math.round(integrityData.reduce((sum, d) => sum + d.integrity.score, 0) / integrityData.length)
      : 100;

    res.json({
      success: true,
      data: {
        assessmentId,
        averageIntegrity,
        totalSessions: sessions.length,
        sessions: integrityData,
      },
    });
  } catch (err) { next(err); }
};

exports.getStudentIntegritySummary = async (req, res, next) => {
  try {
    const { Student } = require('../models');
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });

    const sessions = await AssessmentSession.find({ studentId: student._id });
    
    const integrityData = await Promise.all(
      sessions.map(async (session) => {
        const integrity = await getSessionRiskSummary(session._id);
        return {
          sessionId: session._id,
          assessmentId: session.assessmentId,
          integrity,
        };
      })
    );

    const overallScore = integrityData.length > 0
      ? Math.round(integrityData.reduce((sum, d) => sum + d.integrity.score, 0) / integrityData.length)
      : 100;

    res.json({
      success: true,
      data: {
        overallScore,
        totalAssessments: sessions.length,
        sessions: integrityData,
      },
    });
  } catch (err) { next(err); }
};
