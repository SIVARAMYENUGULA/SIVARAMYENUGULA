const router = require('express').Router();
const integrityController = require('../controllers/integrity.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/session/:sessionId', authenticate, authorize('admin', 'student'), integrityController.getSessionIntegrity);
router.get('/assessment/:assessmentId', authenticate, authorize('admin', 'company'), integrityController.getAssessmentIntegrity);
router.get('/my-summary', authenticate, authorize('student'), integrityController.getStudentIntegritySummary);

module.exports = router;
