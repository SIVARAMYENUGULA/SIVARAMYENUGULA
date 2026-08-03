const router = require('express').Router();
const notifController = require('../controllers/notification.controller');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, notifController.list);
router.put('/:id/read', authenticate, notifController.markRead);
router.put('/read-all', authenticate, notifController.markAllRead);

module.exports = router;