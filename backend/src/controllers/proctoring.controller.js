const mongoose = require('mongoose');
const { ProctoringEvent, AssessmentSession, Student } = require('../models');

exports.logEvent = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { eventType, severity, details, metadata } = req.body;
    
    const session = await AssessmentSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found.' } });
    
    const event = await ProctoringEvent.create({
      sessionId,
      studentId: session.studentId,
      assessmentId: session.assessmentId,
      eventType,
      severity: severity || 'info',
      details,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      timestamp: new Date(),
    });
    
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
};

exports.getEvents = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const events = await ProctoringEvent.find({ sessionId })
      .sort({ timestamp: -1 });
    
    // Get summary counts
    const summary = await ProctoringEvent.aggregate([
      { $match: { sessionId: new mongoose.Types.ObjectId(sessionId) } },
      { $group: { _id: '$eventType', count: { $sum: 1 }, severity: { $first: '$severity' } } },
    ]);
    
    res.json({ success: true, data: { events, summary } });
  } catch (err) { next(err); }
};

exports.getStudentProctoringSummary = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });
    
    const totalEvents = await ProctoringEvent.countDocuments({ studentId: student._id });
    const eventBreakdown = await ProctoringEvent.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(student._id) } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]);
    
    res.json({ success: true, data: { totalEvents, eventBreakdown } });
  } catch (err) { next(err); }
};
