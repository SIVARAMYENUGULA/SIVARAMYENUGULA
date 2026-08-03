const router = require('express').Router();
const auditController = require('../controllers/auditLog.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('admin'), auditController.list);
router.get('/stats', authenticate, authorize('admin'), auditController.getStats);
router.get('/:id', authenticate, authorize('admin'), auditController.getById);

module.exports = router;
