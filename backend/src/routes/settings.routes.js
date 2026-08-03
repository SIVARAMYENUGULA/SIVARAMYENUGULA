const router = require('express').Router();
const settingsController = require('../controllers/settings.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('student'), settingsController.getSettings);
router.put('/', authenticate, authorize('student'), settingsController.updateSettings);
router.put('/change-password', authenticate, authorize('student'), settingsController.changePassword);

module.exports = router;
