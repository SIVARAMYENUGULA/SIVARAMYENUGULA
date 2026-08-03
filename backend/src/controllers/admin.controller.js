const { User, Student, Company, College, AdminProfile, AuditLog, Drive, Assessment, Application, Job, SupportTicket } = require('../models');

exports.stats = async (req, res, next) => {
  try {
    const [totalUsers, totalStudents, totalCompanies, totalColleges, activeJobs, totalDrives, publishedDrives, totalAssessments, totalApplications, totalTickets, openTickets] = await Promise.all([
      User.countDocuments(),
      Student.countDocuments(),
      Company.countDocuments(),
      College.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Drive.countDocuments(),
      Drive.countDocuments({ status: 'published' }),
      Assessment.countDocuments(),
      Application.countDocuments(),
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: { $in: ['Open', 'In Progress'] } }),
    ]);
    res.json({ success: true, data: { totalUsers, totalStudents, totalCompanies, totalColleges, activeJobs, totalDrives, publishedDrives, totalAssessments, totalApplications, totalTickets, openTickets } });
  } catch (err) { next(err); }
};

exports.users = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: users, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
    res.json({ success: true, data: user, message: 'User updated.' });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
    // Clean up role-specific profile
    if (user.role === 'student') await Student.deleteOne({ userId: user._id });
    if (user.role === 'company') await Company.deleteOne({ userId: user._id });
    if (user.role === 'college') await College.deleteOne({ userId: user._id });
    if (user.role === 'admin') await AdminProfile.deleteOne({ userId: user._id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
};

exports.verifyCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found.' } });
    company.verified = req.body.verified !== false;
    if (req.body.companyName) company.companyName = req.body.companyName;
    await company.save();
    res.json({ success: true, data: company, message: 'Company ' + (company.verified ? 'verified' : 'unverified') + '.' });
  } catch (err) { next(err); }
};

exports.verifyCollege = async (req, res, next) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'College not found.' } });
    college.verified = req.body.verified !== false;
    if (req.body.collegeName) college.collegeName = req.body.collegeName;
    await college.save();
    res.json({ success: true, data: college, message: 'College ' + (college.verified ? 'verified' : 'unverified') + '.' });
  } catch (err) { next(err); }
};

exports.getSettings = async (req, res, next) => {
  try {
    const { PlatformSetting } = require('../models');
    let settings;
    try { settings = await PlatformSetting.findOne(); } catch { settings = null; }
    if (!settings) {
      return res.json({ success: true, data: {
        platformName: 'PlaceMux', supportEmail: 'support@placemux.com',
        sessionTimeout: 60, maxLoginAttempts: 5, passwordMinLength: 8,
        smtpHost: '', smtpPort: 587, fromEmail: 'noreply@placemux.com', fromName: 'PlaceMux',
      }});
    }
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { PlatformSetting } = require('../models');
    let settings;
    try { settings = await PlatformSetting.findOne(); } catch { settings = null; }
    if (!settings) {
      const Mongoose = require('mongoose');
      const schema = new Mongoose.Schema({}, { strict: false, timestamps: true });
      const Model = Mongoose.model('PlatformSetting', schema);
      settings = await Model.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, data: settings, message: 'Settings updated.' });
  } catch (err) { next(err); }
};

exports.collegesList = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, verified } = req.query;
    const filter = {};
    if (verified !== undefined) filter.verified = verified === 'true';
    if (search) filter.$or = [
      { collegeName: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];
    const total = await College.countDocuments(filter);
    const colleges = await College.find(filter)
      .populate('userId', 'name email')
      .skip((page - 1) * limit).limit(parseInt(limit))
      .sort({ createdAt: -1 });
    res.json({ success: true, data: colleges, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.createCollege = async (req, res, next) => {
  try {
    const { collegeName, location, website, emailDomains, name, email, password } = req.body;
    if (!collegeName || !name || !email || !password) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'collegeName, name, email, and password are required.' } });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Email already registered.' } });
    const user = await User.create({ name, email, password, role: 'college' });
    const college = await College.create({ userId: user._id, collegeName, location: location || '', website: website || '', emailDomains: emailDomains || [] });
    res.status(201).json({ success: true, data: { user, college }, message: 'College account created.' });
  } catch (err) { next(err); }
};

exports.companiesList = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, verified } = req.query;
    const filter = {};
    if (verified !== undefined) filter.verified = verified === 'true';
    if (search) filter.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { industry: { $regex: search, $options: 'i' } },
    ];
    const total = await Company.countDocuments(filter);
    const companies = await Company.find(filter)
      .populate('userId', 'name email')
      .skip((page - 1) * limit).limit(parseInt(limit))
      .sort({ createdAt: -1 });
    res.json({ success: true, data: companies, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.createCompany = async (req, res, next) => {
  try {
    const { companyName, industry, location, website, description, name, email, password } = req.body;
    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'companyName, name, email, and password are required.' } });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Email already registered.' } });
    const user = await User.create({ name, email, password, role: 'company' });
    const company = await Company.create({ userId: user._id, companyName, industry: industry || '', location: location || '', website: website || '', description: description || '', verified: true });
    res.status(201).json({ success: true, data: { user, company }, message: 'Company account created.' });
  } catch (err) { next(err); }
};

exports.resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'New password must be at least 8 characters.' } });
    }
    user.password = newPassword;
    user.refreshToken = null;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully for ' + user.name + '.' });
  } catch (err) { next(err); }
};

exports.platformAnalytics = async (req, res, next) => {
  try {
    // User growth over last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    
    // Applications per month
    const appTrend = await Application.aggregate([
      { $match: { appliedAt: { $gte: twelveMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$appliedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    
    // Drives per month
    const driveTrend = await Drive.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    
    // Role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    
    // Colleges with most students
    const topColleges = await College.aggregate([
      { $lookup: { from: 'students', localField: '_id', foreignField: 'collegeId', as: 'students' } },
      { $project: { collegeName: 1, studentCount: { $size: '$students' }, verified: 1 } },
      { $sort: { studentCount: -1 } },
      { $limit: 5 },
    ]);
    
    // Companies with most jobs
    const topCompanies = await Company.aggregate([
      { $lookup: { from: 'jobs', localField: '_id', foreignField: 'companyId', as: 'jobs' } },
      { $project: { companyName: 1, jobCount: { $size: '$jobs' }, verified: 1 } },
      { $sort: { jobCount: -1 } },
      { $limit: 5 },
    ]);
    
    // Application status distribution
    const statusDistribution = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    
    res.json({ success: true, data: { userGrowth, appTrend, driveTrend, roleDistribution, topColleges, topCompanies, statusDistribution } });
  } catch (err) { next(err); }
};
