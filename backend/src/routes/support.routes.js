const router = require('express').Router();
const supportController = require('../controllers/support.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/stats', authenticate, authorize('admin'), supportController.getStats);
router.get('/', authenticate, authorize('student', 'admin'), supportController.list);
router.get('/:id', authenticate, authorize('student', 'admin'), supportController.getById);
router.post('/', authenticate, authorize('student'), supportController.create);
router.put('/:id/reply', authenticate, authorize('admin'), supportController.reply);
router.put('/:id/status', authenticate, authorize('admin'), supportController.updateStatus);

module.exports = router;
