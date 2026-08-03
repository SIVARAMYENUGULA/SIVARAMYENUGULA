const router = require('express').Router();
const driveController = require('../controllers/drive.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Static routes FIRST (before parameterized /:id routes)

// Student endpoints (view and register for drives)
router.get('/published/list', authenticate, authorize('student'), driveController.getPublishedDrives);
router.get('/company/list', authenticate, authorize('company'), driveController.getCompanyDrives);

// College endpoints (manage drives)
router.get('/', authenticate, authorize('college'), driveController.list);
router.post('/', authenticate, authorize('college'), driveController.create);

// Parameterized routes (with :id)
router.get('/:id', authenticate, authorize('college', 'company'), driveController.getById);
router.put('/:id', authenticate, authorize('college'), driveController.update);
router.post('/:id/publish', authenticate, authorize('college'), driveController.publish);
router.post('/:id/advance-stage', authenticate, authorize('college'), driveController.advanceStage);
router.get('/:id/eligible-students', authenticate, authorize('college'), driveController.getEligibleStudents);
router.post('/:id/register-students', authenticate, authorize('college'), driveController.registerStudents);
router.get('/:id/check-eligibility', authenticate, authorize('student'), driveController.checkEligibility);
router.post('/:id/self-register', authenticate, authorize('student'), driveController.selfRegister);
router.get('/:id/candidates', authenticate, authorize('company'), driveController.getCandidates);
router.post('/:id/shortlist', authenticate, authorize('company'), driveController.shortlistCandidates);
router.post('/:id/select', authenticate, authorize('company'), driveController.selectCandidates);

module.exports = router;
