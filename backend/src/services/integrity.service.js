const { ProctoringEvent, AssessmentSession, Assessment } = require('../models');

/**
 * Enterprise Integrity Score Engine
 * Calculates a trust score (0-100) based on proctoring events during an assessment.
 * Supports real-time scoring via socket emission and detailed audit trails.
 */

// Event weight configuration — enterprise tuned
const EVENT_WEIGHTS = {
  tab_switch: { weight: 15, maxCount: 3 },
  fullscreen_exit: { weight: 25, maxCount: 2 },
  camera_disconnect: { weight: 20, maxCount: 2 },
  copy_paste: { weight: 20, maxCount: 3 },
  browser_blur: { weight: 10, maxCount: 5 },
  keyboard_shortcut: { weight: 15, maxCount: 3 },
  multiple_faces: { weight: 30, maxCount: 1 },
  face_not_visible: { weight: 15, maxCount: 5 },
  suspicious_activity: { weight: 25, maxCount: 3 },
  phone_disconnected: { weight: 10, maxCount: 5 },
  audio_multiple_voices: { weight: 25, maxCount: 2 },
  object_detected_phone: { weight: 20, maxCount: 3 },
  object_detected_book: { weight: 15, maxCount: 2 },
  camera_quality_degraded: { weight: 10, maxCount: 3 },
  face_not_matched: { weight: 30, maxCount: 1 },
  looking_away: { weight: 10, maxCount: 5 },
  devtools_opened: { weight: 25, maxCount: 2 },
};

// Risk classification thresholds
const RISK_THRESHOLDS = {
  low: { min: 80, label: 'Low Risk', color: 'success', severity: 'info' },
  medium: { min: 60, label: 'Medium Risk', color: 'warning', severity: 'warning' },
  high: { min: 30, label: 'High Risk', color: 'destructive', severity: 'critical' },
  critical: { min: 0, label: 'Critical Risk', color: 'destructive', severity: 'critical' },
};

const calculateIntegrityScore = async (sessionId) => {
  try {
    const events = await ProctoringEvent.find({ sessionId }).sort({ timestamp: 1 });
    const session = await AssessmentSession.findById(sessionId);
    
    if (!session) {
      return { score: 100, classification: 'low', riskLevel: 'Low Risk', details: [] };
    }

    let totalDeduction = 0;
    const deductionDetails = [];
    const eventCounts = {};

    // Count events by type
    events.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });

    // Calculate deductions based on weighted events
    for (const [eventType, count] of Object.entries(eventCounts)) {
      const config = EVENT_WEIGHTS[eventType];
      if (!config) continue;

      const effectiveCount = Math.min(count, config.maxCount);
      const deduction = (effectiveCount / config.maxCount) * config.weight;
      totalDeduction += deduction;

      deductionDetails.push({
        eventType,
        count,
        effectiveCount,
        weight: config.weight,
        deduction: Math.round(deduction * 10) / 10,
      });
    }

    // Duration penalty: if time taken is suspiciously short
    if (session.timeTakenSec > 0) {
      const assessment = await Assessment.findById(session.assessmentId);
      if (assessment && assessment.duration) {
        const durationMinutes = assessment.duration;
        const timeTakenMinutes = session.timeTakenSec / 60;
        // If completed in less than 20% of allotted time, apply penalty
        if (timeTakenMinutes < durationMinutes * 0.2 && timeTakenMinutes > 0) {
          totalDeduction += 10;
          deductionDetails.push({
            eventType: 'suspicious_timing',
            count: 1,
            effectiveCount: 1,
            weight: 10,
            deduction: 10,
            details: `Completed in ${Math.round(timeTakenMinutes)}min of ${durationMinutes}min allotted`,
          });
        }
      }
    }

    // Score = 100 - deductions, minimum 0
    const score = Math.max(0, Math.round(100 - totalDeduction));

    // Classification
    let classification = 'critical';
    let riskLevel = 'Critical Risk';
    for (const [key, threshold] of Object.entries(RISK_THRESHOLDS)) {
      if (score >= threshold.min) {
        classification = key;
        riskLevel = threshold.label;
        break;
      }
    }

    return {
      score,
      classification,
      riskLevel,
      totalEvents: events.length,
      totalDeduction: Math.round(totalDeduction * 10) / 10,
      details: deductionDetails,
    };
  } catch (err) {
    console.error('Integrity score calculation error:', err.message);
    return { score: 100, classification: 'low', riskLevel: 'Low Risk', details: [] };
  }
};

const getSessionRiskSummary = async (sessionId) => {
  const integrity = await calculateIntegrityScore(sessionId);
  const criticalEvents = await ProctoringEvent.countDocuments({
    sessionId,
    severity: 'critical',
  });
  const warningEvents = await ProctoringEvent.countDocuments({
    sessionId,
    severity: 'warning',
  });

  return {
    ...integrity,
    criticalEvents,
    warningEvents,
  };
};

module.exports = { calculateIntegrityScore, getSessionRiskSummary, EVENT_WEIGHTS, RISK_THRESHOLDS };
