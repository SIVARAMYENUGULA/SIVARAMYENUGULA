const router = require('express').Router();
const assignController = require('../controllers/assignment.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', authenticate, authorize('company'), assignController.assign);
router.get('/my', authenticate, authorize('student'), assignController.myAssignments);
router.get('/company', authenticate, authorize('company'), assignController.companyAssignments);
router.get('/analytics', authenticate, authorize('company'), assignController.analytics);
router.get('/candidate/:studentId', authenticate, authorize('company'), assignController.candidateAssessments);
router.get('/:id', authenticate, authorize('student', 'company'), assignController.getById);

module.exports = router;
