const { createAuditLog } = require('../controllers/auditLog.controller');

/**
 * Middleware factory for automatic audit logging of API actions.
 * Usage: router.post('/jobs', authenticate, authorize('company'), auditLogger('CREATE_JOB', 'Job'), jobController.create);
 */
const auditLogger = (action, resource) => {
  return (req, res, next) => {
    // Store original res.json to intercept the response
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      // Only log successful operations
      if (body && body.success === true) {
        createAuditLog({
          userId: req.user ? req.user._id : null,
          action: action || `${req.method}_${resource}`,
          resource: resource || req.baseUrl,
          resourceId: req.params.id || (body.data && body.data._id ? body.data._id : null),
          details: body.message || `${resource} operation completed`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          metadata: { method: req.method, path: req.originalUrl },
        }).catch(err => console.error('Audit log error:', err.message));
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = auditLogger;
