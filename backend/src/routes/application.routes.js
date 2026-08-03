const router = require('express').Router();
const appController = require('../controllers/application.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', authenticate, authorize('student'), appController.submit);
router.get('/', authenticate, authorize('student', 'company'), appController.list);
router.get('/status/:jobId', authenticate, authorize('student'), appController.getStatus);
router.get('/:id', authenticate, authorize('student', 'company'), appController.getById);
router.put('/:id/status', authenticate, authorize('company'), appController.updateStatus);
router.delete('/:id', authenticate, authorize('student', 'company'), appController.withdraw);

module.exports = router;