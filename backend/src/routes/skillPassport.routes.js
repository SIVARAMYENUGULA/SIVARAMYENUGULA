const router = require('express').Router();
const skillPassportController = require('../controllers/skillPassport.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('student'), skillPassportController.getSkills);
router.post('/', authenticate, authorize('student'), skillPassportController.addSkill);
router.put('/:skillId', authenticate, authorize('student'), skillPassportController.updateSkill);
router.delete('/:skillId', authenticate, authorize('student'), skillPassportController.deleteSkill);

module.exports = router;
