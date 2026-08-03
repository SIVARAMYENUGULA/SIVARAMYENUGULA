const { Assessment, Question, AssessmentSession, Score } = require('../models');
const AppError = require('../utils/apiError');

const startAssessment = async (assessmentId, studentId) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw new AppError(404, 'NOT_FOUND', 'Assessment not found.');
  if (!assessment.isActive) throw new AppError(400, 'INACTIVE', 'Assessment is not active.');
  
  const existing = await AssessmentSession.findOne({ assessmentId, studentId });
  if (existing && existing.status === 'completed') {
    throw new AppError(400, 'ALREADY_COMPLETED', 'You have already completed this assessment.');
  }
  
  const questions = await Question.find({ assessmentId }).sort({ orderIndex: 1 });
  if (questions.length === 0) throw new AppError(400, 'NO_QUESTIONS', 'Assessment has no questions.');
  
  const session = existing || new AssessmentSession({ assessmentId, studentId });
  session.status = 'in_progress';
  session.startedAt = new Date();
  session.maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  session.answers = [];
  await session.save();
  
  const sanitizedQuestions = questions.map(q => ({
    _id: q._id, questionText: q.questionText, options: q.options,
    points: q.points, orderIndex: q.orderIndex
  }));
  
  return { session, questions: sanitizedQuestions, duration: assessment.duration };
};

const submitAssessment = async (assessmentId, studentId, answers) => {
  const session = await AssessmentSession.findOne({ assessmentId, studentId, status: 'in_progress' });
  if (!session) throw new AppError(400, 'NO_SESSION', 'No active assessment session found.');
  
  const questions = await Question.find({ assessmentId }).sort({ orderIndex: 1 });
  let score = 0;
  let correctCount = 0;
  const processedAnswers = questions.map(q => {
    const answer = answers.find(a => a.questionId === q._id.toString());
    const isCorrect = answer && answer.selectedIndex === q.correctIndex;
    if (isCorrect) { score += q.points; correctCount++; }
    return { questionId: q._id, selectedIndex: answer?.selectedIndex, isCorrect };
  });
  
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  session.answers = processedAnswers;
  session.score = score;
  session.maxScore = maxScore;
  session.percentage = percentage;
  session.status = 'completed';
  session.completedAt = new Date();
  session.timeTakenSec = Math.floor((session.completedAt - session.startedAt) / 1000);
  await session.save();
  
  const assessment = await Assessment.findById(assessmentId);
  const grade = percentage >= 90 ? 'Excellent' : percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : 'Needs Improvement';
  
  const scoreRecord = await Score.create({
    sessionId: session._id, studentId, assessmentId,
    assessmentTitle: assessment.title, assessmentType: assessment.type,
    score, maxScore, percentage, passed: percentage >= assessment.passingScore,
    grade, correctCount, totalQuestions: questions.length,
    timeTakenSec: session.timeTakenSec, completedAt: session.completedAt,
  });
  
  return scoreRecord;
};

module.exports = { startAssessment, submitAssessment };