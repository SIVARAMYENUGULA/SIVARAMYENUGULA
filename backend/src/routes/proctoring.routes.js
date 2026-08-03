const router = require('express').Router();
const proctorController = require('../controllers/proctoring.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/sessions/:sessionId/events', authenticate, authorize('student'), proctorController.logEvent);
router.get('/sessions/:sessionId/events', authenticate, authorize('student', 'admin'), proctorController.getEvents);
router.get('/my-summary', authenticate, authorize('student'), proctorController.getStudentProctoringSummary);

module.exports = router;
