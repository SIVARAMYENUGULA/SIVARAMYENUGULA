const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/jobs', require('./job.routes'));
router.use('/applications', require('./application.routes'));
router.use('/assessments', require('./assessment.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/audit-logs', require('./auditLog.routes'));
router.use('/interviews', require('./interview.routes'));
router.use('/proctoring', require('./proctoring.routes'));
router.use('/integrity', require('./integrity.routes'));
router.use('/otp', require('./otp.routes'));
router.use('/assignments', require('./assignment.routes'));
router.use('/result-review', require('./result-review.routes'));
router.use('/college', require('./college.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/skills', require('./skillPassport.routes'));
router.use('/upload', require('./upload.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/support', require('./support.routes'));
router.use('/drives', require('./drive.routes'));
router.use('/offers', require('./offer.routes'));

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// DEBUG: Expose email delivery log (for E2E testing only)
const { getDeliveryLog } = require('../services/email.service');
router.get('/debug/delivery-log', (req, res) => {
  res.json({ success: true, data: getDeliveryLog() });
});

module.exports = router;