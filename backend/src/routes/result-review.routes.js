const router = require('express').Router();
const resultController = require('../controllers/result-review.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('company'), resultController.companyResults);
router.get('/:studentId/:assessmentId', authenticate, authorize('company'), resultController.studentAssessmentResult);

module.exports = router;
