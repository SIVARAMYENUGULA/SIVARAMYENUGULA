const router = require('express').Router();
const jobController = require('../controllers/job.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('student', 'company', 'college', 'admin'), jobController.list);
router.get('/recommended', authenticate, authorize('student', 'company', 'admin'), jobController.recommended);
router.get('/:id', authenticate, jobController.getById);
router.post('/', authenticate, authorize('company', 'admin'), jobController.create);
router.put('/:id', authenticate, authorize('company', 'admin'), jobController.update);
router.delete('/:id', authenticate, authorize('company', 'admin'), jobController.remove);

module.exports = router;