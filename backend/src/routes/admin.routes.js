const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const auditLogger = require('../middleware/auditLogger');

// Dashboard & Analytics
router.get('/stats', authenticate, authorize('admin'), adminController.stats);
router.get('/analytics', authenticate, authorize('admin'), adminController.platformAnalytics);

// User Management
router.get('/users', authenticate, authorize('admin'), adminController.users);
router.put('/users/:id', authenticate, authorize('admin'), auditLogger('UPDATE_USER', 'User'), adminController.updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), auditLogger('DELETE_USER', 'User'), adminController.deleteUser);
router.post('/users/:id/reset-password', authenticate, authorize('admin'), auditLogger('RESET_USER_PASSWORD', 'User'), adminController.resetUserPassword);

// College Management
router.get('/colleges', authenticate, authorize('admin'), adminController.collegesList);
router.post('/colleges', authenticate, authorize('admin'), auditLogger('CREATE_COLLEGE', 'College'), adminController.createCollege);
router.put('/colleges/:id/verify', authenticate, authorize('admin'), auditLogger('VERIFY_COLLEGE', 'College'), adminController.verifyCollege);

// Company Management
router.get('/companies', authenticate, authorize('admin'), adminController.companiesList);
router.post('/companies', authenticate, authorize('admin'), auditLogger('CREATE_COMPANY', 'Company'), adminController.createCompany);
router.put('/companies/:id/verify', authenticate, authorize('admin'), auditLogger('VERIFY_COMPANY', 'Company'), adminController.verifyCompany);

// Platform Settings
router.get('/settings', authenticate, authorize('admin'), adminController.getSettings);
router.put('/settings', authenticate, authorize('admin'), auditLogger('UPDATE_SETTINGS', 'PlatformSettings'), adminController.updateSettings);

module.exports = router;
