const { AuditLog } = require('../models');

const createAuditLog = async ({ userId, action, resource, resourceId, details, ipAddress, userAgent, metadata }) => {
  try {
    return await AuditLog.create({ userId, action, resource, resourceId, details, ipAddress, userAgent, metadata });
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { action, userId, resource, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (resource) filter.resource = resource;
    
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({ success: true, data: logs, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('userId', 'name email role');
    if (!log) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Audit log not found.' } });
    res.json({ success: true, data: log });
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const recentActions = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const dailyStats = await AuditLog.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);
    res.json({ success: true, data: { totalLogs, recentActions, dailyStats } });
  } catch (err) { next(err); }
};

exports.createAuditLog = createAuditLog;
