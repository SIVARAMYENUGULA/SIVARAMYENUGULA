const fs = require('fs');
const path = require('path');
const b = 'backend';
const w = (p, c) => fs.writeFileSync(path.join(b, p), c);

console.log('Starting backend creation...');

// Config
w('src/config/env.js', `require('dotenv').config();
const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/placemux',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};
module.exports = env;`);
console.log('1/11 Config env.js');

w('src/config/db.js', `const mongoose = require('mongoose');
const env = require('./env');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri);
    console.log('MongoDB connected: ' + conn.connection.host);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
module.exports = connectDB;`);
console.log('2/11 Config db.js');

w('src/config/cors.js', `const env = require('./env');
const corsOptions = {
  origin: env.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
module.exports = corsOptions;`);
console.log('3/11 Config cors.js');

console.log('Config files done.');

// ============================================================
// MODELS
// ============================================================

w('src/models/User.js', `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['student', 'company', 'college', 'admin'], required: true },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  lastLoginAt: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);`);
console.log('4/11 Model User.js');

w('src/models/Student.js', `const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
  course: { type: String, default: '' },
  year: { type: Number, min: 1, max: 6 },
  phone: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  profileCompleted: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });
module.exports = mongoose.model('Student', studentSchema);`);
console.log('5/11 Model Student.js');

w('src/models/Company.js', `const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  industry: { type: String, default: '' },
  companySize: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  description: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  verified: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Company', companySchema);`);
console.log('6/11 Model Company.js');

w('src/models/College.js', `const mongoose = require('mongoose');
const collegeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  collegeName: { type: String, required: true },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  totalStudents: { type: Number, default: 0 },
  placementRate: { type: Number, default: 0 },
  averagePackage: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('College', collegeSchema);`);
console.log('7/11 Model College.js');

w('src/models/Job.js', `const mongoose = require('mongoose');
const jobSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, default: '' },
  type: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], required: true },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  salaryCurrency: { type: String, default: 'INR' },
  skillsRequired: [{ type: String, trim: true }],
  applicantsCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'draft' },
  postedAt: { type: Date, default: Date.now },
  deadline: { type: Date },
}, { timestamps: true });
jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ skillsRequired: 1 });
module.exports = mongoose.model('Job', jobSchema);`);
console.log('8/11 Model Job.js');

w('src/models/Application.js', `const mongoose = require('mongoose');
const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['Applied', 'Shortlisted', 'Interview', 'Accepted', 'Rejected'], default: 'Applied' },
  resumeUrl: { type: String, default: '' },
  coverLetter: { type: String, default: '' },
  additionalInfo: { type: mongoose.Schema.Types.Mixed },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });
applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
applicationSchema.index({ studentId: 1 });
applicationSchema.index({ status: 1 });
module.exports = mongoose.model('Application', applicationSchema);`);
console.log('9/11 Model Application.js');

w('src/models/Assessment.js', `const mongoose = require('mongoose');
const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Technical', 'Aptitude', 'Soft_Skills', 'Domain'], required: true },
  maxScore: { type: Number, default: 100 },
  duration: { type: Number, required: true },
  passingScore: { type: Number, default: 60 },
  description: { type: String, default: '' },
  instructions: { type: String, default: '' },
  questionCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Assessment', assessmentSchema);`);
console.log('10/11 Model Assessment.js');

console.log('Models done.');

// Remaining Models
w('src/models/Question.js', `const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  points: { type: Number, default: 10 },
  orderIndex: { type: Number, required: true },
}, { timestamps: true });
questionSchema.index({ assessmentId: 1, orderIndex: 1 });
module.exports = mongoose.model('Question', questionSchema);`);

w('src/models/AssessmentSession.js', `const mongoose = require('mongoose');
const sessionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'timed_out'], default: 'pending' },
  answers: [{ questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, selectedIndex: Number, isCorrect: Boolean, timeSpent: Number }],
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  startedAt: { type: Date },
  completedAt: { type: Date },
  timeTakenSec: { type: Number, default: 0 },
}, { timestamps: true });
sessionSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
sessionSchema.index({ studentId: 1 });
module.exports = mongoose.model('AssessmentSession', sessionSchema);`);

w('src/models/Score.js', `const mongoose = require('mongoose');
const scoreSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentSession', required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  assessmentTitle: String, assessmentType: String,
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: Boolean,
  grade: { type: String, enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'] },
  correctCount: Number, totalQuestions: Number, timeTakenSec: Number,
  completedAt: { type: Date },
}, { timestamps: true });
scoreSchema.index({ studentId: 1 });
scoreSchema.index({ completedAt: -1 });
module.exports = mongoose.model('Score', scoreSchema);`);

w('src/models/SkillPassport.js', `const mongoose = require('mongoose');
const skillSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  skills: [{ name: String, category: { type: String, enum: ['Frontend', 'Backend', 'AI/ML', 'Database', 'DevOps', 'Other'] }, level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] }, endorsements: { type: Number, default: 0 }, assessedAt: Date }],
  overallScore: { type: Number, default: 0 },
  lastUpdated: { type: Date },
}, { timestamps: true });
module.exports = mongoose.model('SkillPassport', skillSchema);`);

w('src/models/Notification.js', `const mongoose = require('mongoose');
const notifSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
notifSchema.index({ userId: 1, isRead: 1 });
notifSchema.index({ createdAt: -1 });
module.exports = mongoose.model('Notification', notifSchema);`);

w('src/models/AuditLog.js', `const mongoose = require('mongoose');
const auditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  resource: { type: String, default: '' },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
auditSchema.index({ userId: 1 });
auditSchema.index({ action: 1 });
auditSchema.index({ createdAt: -1 });
module.exports = mongoose.model('AuditLog', auditSchema);`);

w('src/models/index.js', `module.exports = {
  User: require('./User'),
  Student: require('./Student'),
  Company: require('./Company'),
  College: require('./College'),
  Job: require('./Job'),
  Application: require('./Application'),
  Assessment: require('./Assessment'),
  Question: require('./Question'),
  AssessmentSession: require('./AssessmentSession'),
  Score: require('./Score'),
  SkillPassport: require('./SkillPassport'),
  Notification: require('./Notification'),
  AuditLog: require('./AuditLog'),
};`);

console.log('All models created (13 + index).');

// ============================================================
// MIDDLEWARE
// ============================================================
w('src/middleware/authenticate.js', `const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'Access denied. No token provided.' } });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_USER', message: 'User not found or deactivated.' } });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Token expired.' } });
    }
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token.' } });
  }
};`);

w('src/middleware/authorize.js', `module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required.' } });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions.' } });
    }
    next();
  };
};`);

w('src/middleware/errorHandler.js', `const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: messages.join(', ') } });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: \`\${field} already exists.\` } });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid resource ID.' } });
  }
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error.',
    },
  });
};`);

console.log('Middleware done.');

// ============================================================
// UTILS
// ============================================================
w('src/utils/apiResponse.js', `const success = (data, message = 'Success', statusCode = 200) => ({
  statusCode,
  body: { success: true, data, message },
});

const paginated = (data, total, page, limit) => ({
  statusCode: 200,
  body: {
    success: true,
    data,
    pagination: {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      total,
      pages: Math.ceil(total / (parseInt(limit) || 20)),
    },
  },
});

module.exports = { success, paginated };`);

w('src/utils/apiError.js', `class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = AppError;`);

w('src/utils/jwt.js', `const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user) => {
  return jwt.sign(
    { sub: user._id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { sub: user._id },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken };`);

console.log('Utils done.');

// ============================================================
// SERVICES
// ============================================================
w('src/services/auth.service.js', `const { User, Student, Company, College, AdminProfile } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/apiError');

const register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError(409, 'DUPLICATE_EMAIL', 'Email already registered.');
  
  const user = await User.create({ name, email, password, role });
  
  // Create role-specific profile
  if (role === 'student') await Student.create({ userId: user._id });
  if (role === 'company') await Company.create({ userId: user._id });
  if (role === 'college') await College.create({ userId: user._id });
  if (role === 'admin') await AdminProfile.create({ userId: user._id });
  
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();
  
  return { user, token, refreshToken };
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  if (!user.isActive) throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is deactivated.');
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();
  
  return { user, token, refreshToken };
};

const refreshUserToken = async (refreshToken) => {
  const { verifyRefreshToken } = require('../utils/jwt');
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.sub).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token.');
  }
  const token = generateAccessToken(user);
  const newRefresh = generateRefreshToken(user);
  user.refreshToken = newRefresh;
  await user.save();
  return { token, refreshToken: newRefresh };
};

module.exports = { register, login, refreshUserToken };`);

w('src/services/assessment.service.js', `const { Assessment, Question, AssessmentSession, Score } = require('../models');
const AppError = require('../utils/apiError');

const startAssessment = async (assessmentId, studentId) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) throw new AppError(404, 'NOT_FOUND', 'Assessment not found.');
  if (!assessment.isActive) throw new AppError(400, 'INACTIVE', 'Assessment is not active.');
  
  const existing = await AssessmentSession.findOne({ assessmentId, studentId });
  if (existing && existing.status === 'completed') {
    throw new AppError(400, 'ALREADY_COMPLETED', 'You have already completed this assessment.');
  }
  
  const questions = await Question.find({ assessmentId }).sort({ orderIndex: 1 });
  if (questions.length === 0) throw new AppError(400, 'NO_QUESTIONS', 'Assessment has no questions.');
  
  const session = existing || new AssessmentSession({ assessmentId, studentId });
  session.status = 'in_progress';
  session.startedAt = new Date();
  session.maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  session.answers = [];
  await session.save();
  
  const sanitizedQuestions = questions.map(q => ({
    _id: q._id, questionText: q.questionText, options: q.options,
    points: q.points, orderIndex: q.orderIndex
  }));
  
  return { session, questions: sanitizedQuestions, duration: assessment.duration };
};

const submitAssessment = async (assessmentId, studentId, answers) => {
  const session = await AssessmentSession.findOne({ assessmentId, studentId, status: 'in_progress' });
  if (!session) throw new AppError(400, 'NO_SESSION', 'No active assessment session found.');
  
  const questions = await Question.find({ assessmentId }).sort({ orderIndex: 1 });
  let score = 0;
  let correctCount = 0;
  const processedAnswers = questions.map(q => {
    const answer = answers.find(a => a.questionId === q._id.toString());
    const isCorrect = answer && answer.selectedIndex === q.correctIndex;
    if (isCorrect) { score += q.points; correctCount++; }
    return { questionId: q._id, selectedIndex: answer?.selectedIndex, isCorrect };
  });
  
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  session.answers = processedAnswers;
  session.score = score;
  session.maxScore = maxScore;
  session.percentage = percentage;
  session.status = 'completed';
  session.completedAt = new Date();
  session.timeTakenSec = Math.floor((session.completedAt - session.startedAt) / 1000);
  await session.save();
  
  const assessment = await Assessment.findById(assessmentId);
  const grade = percentage >= 90 ? 'Excellent' : percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : 'Needs Improvement';
  
  const scoreRecord = await Score.create({
    sessionId: session._id, studentId, assessmentId,
    assessmentTitle: assessment.title, assessmentType: assessment.type,
    score, maxScore, percentage, passed: percentage >= assessment.passingScore,
    grade, correctCount, totalQuestions: questions.length,
    timeTakenSec: session.timeTakenSec, completedAt: session.completedAt,
  });
  
  return scoreRecord;
};

module.exports = { startAssessment, submitAssessment };`);

w('src/services/notification.service.js', `const { Notification } = require('../models');

const createNotification = async (userId, title, message, type = 'info', link = '', metadata = {}) => {
  return Notification.create({ userId, title, message, type, link, metadata });
};

const notifyApplicationUpdate = async (studentId, jobTitle, companyName, status) => {
  const messages = {
    Applied: \`You applied to \${jobTitle} at \${companyName}\`,
    Shortlisted: \`Your application for \${jobTitle} has been shortlisted!\`,
    Interview: \`You have been called for an interview for \${jobTitle}\`,
    Accepted: \`Congratulations! Your application for \${jobTitle} has been accepted!\`,
    Rejected: \`Your application for \${jobTitle} was not selected.\`,
  };
  return createNotification(
    studentId, \`Application \${status}\`, messages[status] || \`Status updated to \${status}\`,
    status === 'Accepted' ? 'success' : status === 'Rejected' ? 'error' : 'info'
  );
};

module.exports = { createNotification, notifyApplicationUpdate };`);

console.log('Services done.');

// ============================================================
// CONTROLLERS
// ============================================================
w('src/controllers/auth.controller.js', `const authService = require('../services/auth.service');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result, message: 'Registration successful.' });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result, message: 'Login successful.' });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshUserToken(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const { Student, Company, College } = require('../models');
    let profile = null;
    if (req.user.role === 'student') profile = await Student.findOne({ userId: req.user._id }).populate('collegeId');
    else if (req.user.role === 'company') profile = await Company.findOne({ userId: req.user._id });
    else if (req.user.role === 'college') profile = await College.findOne({ userId: req.user._id });
    res.json({ success: true, data: { user: req.user, profile } });
  } catch (err) { next(err); }
};`);

w('src/controllers/job.controller.js', `const { Job, Company } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const { status, type, skills, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (skills) filter.skillsRequired = { $in: skills.split(',') };
    if (search) filter.title = { $regex: search, $options: 'i' };
    
    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate({ path: 'companyId', select: 'companyName industry logoUrl location' })
      .sort({ postedAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));
    
    res.json({ success: true, data: jobs, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate({ path: 'companyId', select: 'companyName industry location logoUrl' });
    if (!job) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found.' } });
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    const job = await Job.create({ ...req.body, companyId: company._id });
    res.status(201).json({ success: true, data: job, message: 'Job created.' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found.' } });
    res.json({ success: true, data: job, message: 'Job updated.' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Job deleted.' });
  } catch (err) { next(err); }
};`);

w('src/controllers/application.controller.js', `const { Application, Job, Student } = require('../models');
const { notifyApplicationUpdate } = require('../services/notification.service');

exports.submit = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    
    const existing = await Application.findOne({ jobId: req.body.jobId, studentId: student._id });
    if (existing) return res.status(409).json({ success: false, error: { code: 'ALREADY_APPLIED', message: 'Already applied.' } });
    
    const job = await Job.findById(req.body.jobId);
    if (!job) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found.' } });
    
    const application = await Application.create({ ...req.body, studentId: student._id });
    await Job.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } });
    await notifyApplicationUpdate(student.userId, job.title, job.company, 'Applied');
    
    res.status(201).json({ success: true, data: application, message: 'Application submitted.' });
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const { Student, Company } = require('../models');
    let filter = {};
    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      filter.studentId = student._id;
    } else if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      const jobs = await Job.find({ companyId: company._id }).select('_id');
      filter.jobId = { $in: jobs.map(j => j._id) };
    }
    
    const applications = await Application.find(filter)
      .populate('jobId').populate('studentId')
      .sort({ appliedAt: -1 });
    
    res.json({ success: true, data: applications });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    
    application.status = status;
    await application.save();
    
    const student = await Student.findById(application.studentId);
    await notifyApplicationUpdate(student.userId, application.jobId.title, application.jobId.company, status);
    
    res.json({ success: true, data: application, message: \`Status updated to \${status}.\` });
  } catch (err) { next(err); }
};`);

console.log('Controllers done.');

// ============================================================
// ASSESSMENT & NOTIFICATION CONTROLLERS
// ============================================================
w('src/controllers/assessment.controller.js', `const { Assessment, Question, AssessmentSession, Score, Student } = require('../models');
const assessmentService = require('../services/assessment.service');

exports.list = async (req, res, next) => {
  try {
    const assessments = await Assessment.find({ isActive: true }).select('-__v');
    res.json({ success: true, data: assessments });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assessment not found.' } });
    res.json({ success: true, data: assessment });
  } catch (err) { next(err); }
};

exports.start = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });
    const result = await assessmentService.startAssessment(req.params.id, student._id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.submit = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });
    const result = await assessmentService.submitAssessment(req.params.id, student._id, req.body.answers);
    res.json({ success: true, data: result, message: 'Assessment submitted.' });
  } catch (err) { next(err); }
};

exports.results = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });
    const score = await Score.findOne({ assessmentId: req.params.id, studentId: student._id }).sort({ completedAt: -1 });
    if (!score) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No results found.' } });
    res.json({ success: true, data: score });
  } catch (err) { next(err); }
};

exports.history = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT', message: 'Student profile required.' } });
    const scores = await Score.find({ studentId: student._id }).sort({ completedAt: -1 });
    res.json({ success: true, data: scores });
  } catch (err) { next(err); }
};`);

w('src/controllers/notification.controller.js', `const { Notification } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found.' } });
    res.json({ success: true, data: notif });
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
};`);

console.log('Assessment & Notification controllers done.');

// ============================================================
// ROUTES
// ============================================================
w('src/routes/auth.routes.js', `const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;`);

w('src/routes/job.routes.js', `const router = require('express').Router();
const jobController = require('../controllers/job.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('student', 'company', 'college', 'admin'), jobController.list);
router.get('/:id', authenticate, jobController.getById);
router.post('/', authenticate, authorize('company', 'admin'), jobController.create);
router.put('/:id', authenticate, authorize('company', 'admin'), jobController.update);
router.delete('/:id', authenticate, authorize('admin'), jobController.remove);

module.exports = router;`);

w('src/routes/application.routes.js', `const router = require('express').Router();
const appController = require('../controllers/application.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/', authenticate, authorize('student'), appController.submit);
router.get('/', authenticate, authorize('student', 'company'), appController.list);
router.put('/:id/status', authenticate, authorize('company'), appController.updateStatus);

module.exports = router;`);

w('src/routes/assessment.routes.js', `const router = require('express').Router();
const assessController = require('../controllers/assessment.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('student'), assessController.list);
router.get('/history', authenticate, authorize('student'), assessController.history);
router.get('/:id', authenticate, authorize('student'), assessController.getById);
router.post('/:id/start', authenticate, authorize('student'), assessController.start);
router.post('/:id/submit', authenticate, authorize('student'), assessController.submit);
router.get('/:id/results', authenticate, authorize('student'), assessController.results);

module.exports = router;`);

w('src/routes/notification.routes.js', `const router = require('express').Router();
const notifController = require('../controllers/notification.controller');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, notifController.list);
router.put('/:id/read', authenticate, notifController.markRead);
router.put('/read-all', authenticate, notifController.markAllRead);

module.exports = router;`);

w('src/routes/index.js', `const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/jobs', require('./job.routes'));
router.use('/applications', require('./application.routes'));
router.use('/assessments', require('./assessment.routes'));
router.use('/notifications', require('./notification.routes'));

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

module.exports = router;`);

console.log('Routes done.');

// ============================================================
// SERVER ENTRY POINTS
// ============================================================
w('src/app.js', `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const corsOptions = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: \`Route \${req.originalUrl} not found.\` } });
});

// Error handler
app.use(errorHandler);

module.exports = app;`);

w('server.js', `require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');

const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log('PlaceMux Backend running on port ' + env.port);
    console.log('Environment: ' + env.nodeEnv);
  });
};

start().catch(console.error);`);

console.log('Server entry points done.');

// ============================================================
// SEED SCRIPT
// ============================================================
w('scripts/seed.js', `require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const env = require('../src/config/env');
const { User, Student, Company, College, Assessment, Question } = require('../src/models');

const seed = async () => {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to MongoDB');
  
  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Student.deleteMany({}), Company.deleteMany({}),
    College.deleteMany({}), Assessment.deleteMany({}), Question.deleteMany({})
  ]);
  
  // Create admin
  const admin = await User.create({ name: 'Admin User', email: 'shabirsk989+admin@gmail.com', password: 'Admin@123', role: 'admin', isVerified: true });
  console.log('Admin created:', admin.email);
  
  // Create student
  const studentUser = await User.create({ name: 'Arjun Mehta', email: 'shabirsk989+student@gmail.com', password: 'Student@123', role: 'student', isVerified: true });
  const student = await Student.create({ userId: studentUser._id, course: 'B.Tech Computer Science', year: 3, profileCompleted: 85 });
  console.log('Student created:', studentUser.email);
  
  // Create company
  const companyUser = await User.create({ name: 'TechCorp HR', email: 'shabirsk989+company@gmail.com', password: 'Company@123', role: 'company', isVerified: true });
  const company = await Company.create({ userId: companyUser._id, industry: 'Technology', companySize: '1000-5000', location: 'Bangalore', verified: true });
  console.log('Company created:', companyUser.email);
  
  // Create college
  const collegeUser = await User.create({ name: 'IIT Bombay Placement', email: 'shabirsk989+college@gmail.com', password: 'College@123', role: 'college', isVerified: true });
  const college = await College.create({ userId: collegeUser._id, collegeName: 'Indian Institute of Technology, Bombay', totalStudents: 8500, placementRate: 92.5, verified: true });
  console.log('College created:', collegeUser.email);
  
  // Create sample assessments
  const assess1 = await Assessment.create({ title: 'Full Stack Development', type: 'Technical', duration: 120, passingScore: 60, isActive: true });
  const assess2 = await Assessment.create({ title: 'Aptitude Test', type: 'Aptitude', duration: 60, passingScore: 60, isActive: true });
  
  // Questions for Assessment 1
  await Question.insertMany([
    { assessmentId: assess1._id, questionText: 'Which of the following is a key feature of React?', options: ['Two-way data binding', 'Virtual DOM', 'Direct DOM manipulation', 'Server-side rendering only'], correctIndex: 1, points: 10, orderIndex: 1 },
    { assessmentId: assess1._id, questionText: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correctIndex: 1, points: 10, orderIndex: 2 },
    { assessmentId: assess1._id, questionText: 'Which hook is used for side effects in React?', options: ['useState', 'useEffect', 'useContext', 'useReducer'], correctIndex: 1, points: 10, orderIndex: 3 },
    { assessmentId: assess1._id, questionText: 'What does REST stand for?', options: ['Representational State Transfer', 'Remote State Transfer', 'Representational Server Transfer', 'Remote Server Transaction'], correctIndex: 0, points: 10, orderIndex: 4 },
    { assessmentId: assess1._id, questionText: 'Which of the following is a NoSQL database?', options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'], correctIndex: 2, points: 10, orderIndex: 5 },
  ]);
  
  // Questions for Assessment 2
  await Question.insertMany([
    { assessmentId: assess2._id, questionText: 'If a train travels 60 km in 1 hour, how far will it travel in 45 minutes?', options: ['40 km', '45 km', '50 km', '55 km'], correctIndex: 1, points: 10, orderIndex: 1 },
    { assessmentId: assess2._id, questionText: 'What comes next in the sequence: 2, 6, 18, 54, ?', options: ['108', '162', '72', '216'], correctIndex: 1, points: 10, orderIndex: 2 },
    { assessmentId: assess2._id, questionText: 'What is 15% of 200?', options: ['20', '25', '30', '35'], correctIndex: 2, points: 10, orderIndex: 3 },
  ]);
  
  console.log('Seed data created successfully!');
  console.log('Default passwords: Admin@123, Student@123, Company@123, College@123');
  
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });`);

console.log('Seed script done.');

// List all created files
const fs2 = require('fs');
const walkDir = (dir) => {
  const files = fs2.readdirSync(dir, { withFileTypes: true });
  files.forEach(f => {
    const fp = dir + '/' + f.name;
    if (f.isDirectory()) walkDir(fp);
    else console.log('  ' + fp);
  });
};
console.log('\nAll backend files:');
walkDir('backend');
