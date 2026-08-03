const router = require('express').Router();
const offerController = require('../controllers/offer.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('student', 'company', 'admin'), offerController.list);
router.get('/:id', authenticate, authorize('student', 'company', 'admin'), offerController.getById);
router.post('/', authenticate, authorize('company'), offerController.create);
router.put('/:id', authenticate, authorize('company'), offerController.update);
router.post('/:id/send', authenticate, authorize('company'), offerController.send);
router.post('/:id/accept', authenticate, authorize('student', 'company', 'admin'), offerController.accept);
router.post('/:id/reject', authenticate, authorize('student', 'company', 'admin'), offerController.reject);
router.delete('/:id', authenticate, authorize('company'), offerController.delete);

module.exports = router;
