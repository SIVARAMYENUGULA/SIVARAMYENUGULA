const router = require('express').Router();
const interviewController = require('../controllers/interview.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('company', 'student'), interviewController.list);
router.get('/upcoming', authenticate, authorize('company', 'student'), interviewController.getUpcoming);
router.get('/my-history', authenticate, authorize('student'), interviewController.getStudentHistory);
router.get('/:id', authenticate, authorize('company', 'student'), interviewController.getById);
router.post('/', authenticate, authorize('company'), interviewController.schedule);
router.put('/:id', authenticate, authorize('company', 'student'), interviewController.update);
router.delete('/:id', authenticate, authorize('company', 'student'), interviewController.cancel);

module.exports = router;
