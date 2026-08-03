const mongoose = require('mongoose');

const proctoringEventSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentSession', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  eventType: {
    type: String,
    enum: [
      'tab_switch', 'fullscreen_exit', 'camera_disconnect', 'keyboard_shortcut',
      'multiple_faces', 'face_not_visible', 'suspicious_activity',
      'camera_health', 'copy_paste', 'browser_blur', 'phone_disconnected',
      'audio_multiple_voices', 'object_detected_phone', 'object_detected_book',
      'camera_quality_degraded', 'face_not_matched', 'looking_away',
      'devtools_opened', 'ice_failed', 'reconnected'
    ],
    required: true,
  },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  details: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

proctoringEventSchema.index({ sessionId: 1 });
proctoringEventSchema.index({ studentId: 1 });
proctoringEventSchema.index({ eventType: 1 });
proctoringEventSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ProctoringEvent', proctoringEventSchema);
