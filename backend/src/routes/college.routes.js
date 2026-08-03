const router = require('express').Router();
const collegeController = require('../controllers/college.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/dashboard', authenticate, authorize('college'), collegeController.dashboard);
router.get('/students', authenticate, authorize('college'), collegeController.students);
router.get('/students/:id', authenticate, authorize('college'), collegeController.studentDetail);
router.get('/companies', authenticate, authorize('college'), collegeController.companies);
router.get('/companies/:id', authenticate, authorize('college'), collegeController.companyDetail);
router.get('/analytics', authenticate, authorize('college'), collegeController.analytics);
router.get('/assessment-reports', authenticate, authorize('college'), collegeController.assessmentReports);
router.get('/salary-analytics', authenticate, authorize('college'), collegeController.salaryAnalytics);

// Domain management — enterprise college-student association
router.get('/domains', authenticate, authorize('college'), collegeController.getDomains);
router.put('/domains', authenticate, authorize('college'), collegeController.updateDomains);
router.post('/domains/link', authenticate, authorize('college'), collegeController.relinkStudents);
router.get('/domains/suggest', authenticate, authorize('college'), collegeController.suggestDomains);

module.exports = router;
