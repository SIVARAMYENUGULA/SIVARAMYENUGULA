const router = require('express').Router();
const assessController = require('../controllers/assessment.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Student routes
router.get('/', authenticate, authorize('student', 'company', 'admin'), assessController.list);
router.get('/history', authenticate, authorize('student'), assessController.history);

// Admin/Company assessment management (specific routes BEFORE parameterized)
router.post('/', authenticate, authorize('company', 'admin'), assessController.create);
router.get('/company/results', authenticate, authorize('company'), assessController.companyResults);

// Parameterized routes (must come after specific routes)
router.get('/:id', authenticate, authorize('student', 'company', 'admin'), assessController.getById);
router.post('/:id/start', authenticate, authorize('student'), assessController.start);
router.post('/:id/submit', authenticate, authorize('student'), assessController.submit);
router.get('/:id/results', authenticate, authorize('student'), assessController.results);
router.post('/:id/questions', authenticate, authorize('company', 'admin'), assessController.addQuestions);
router.post('/:id/assign', authenticate, authorize('company'), assessController.assignToStudents);

module.exports = router;