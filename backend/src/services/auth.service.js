const { User, Student, Company, College, AdminProfile } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/apiError');

/**
 * Extract the email domain from an email address.
 * e.g. "arjun@college.edu" → "college.edu"
 */
const extractDomain = (email) => {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1].toLowerCase() : null;
};

/**
 * Find a college whose registered email domains match the given email.
 * Returns the matching college document or null.
 */
const findCollegeByEmailDomain = async (email) => {
  const domain = extractDomain(email);
  if (!domain) return null;
  const colleges = await College.find({ emailDomains: { $exists: true, $not: { $size: 0 } } }).lean();
  for (const college of colleges) {
    if (college.emailDomains.some(d => domain === d.toLowerCase() || domain.endsWith('.' + d.toLowerCase()))) {
      return college;
    }
  }
  return null;
};

const register = async ({ name, email, password, role, collegeId }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError(409, 'DUPLICATE_EMAIL', 'Email already registered.');

  const user = await User.create({ name, email, password, role });

  // Create role-specific profile
  if (role === 'student') {
    // Auto-link college: if collegeId is explicitly provided, use it.
    // Otherwise, attempt domain-based auto-linking.
    let linkedCollegeId = collegeId || null;
    if (!linkedCollegeId) {
      const matchedCollege = await findCollegeByEmailDomain(email);
      if (matchedCollege) linkedCollegeId = matchedCollege._id;
    }
    await Student.create({ userId: user._id, collegeId: linkedCollegeId });
  }
  if (role === 'company') await Company.create({ userId: user._id });
  if (role === 'college') await College.create({ userId: user._id, collegeName: name || 'College', location: '', website: '' });
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

const updateProfile = async (userId, updates) => {
  const allowedFields = ['name', 'avatar'];
  const filtered = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  if (Object.keys(filtered).length > 0) {
    await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  }

  // Also update role-specific profile fields
  const user = await User.findById(userId);
  if (user.role === 'student') {
    const studentFields = ['collegeId', 'course', 'year', 'phone', 'linkedinUrl', 'portfolioUrl', 'resumeUrl', 'bio'];
    const studentUpdates = {};
    for (const key of studentFields) {
      if (updates[key] !== undefined) studentUpdates[key] = updates[key];
    }
    if (Object.keys(studentUpdates).length > 0) {
      // Calculate profile completion
      const fields = ['course', 'year', 'phone', 'linkedinUrl', 'bio'];
      const existingStudent = await Student.findOne({ userId });
      if (existingStudent) {
        Object.assign(studentUpdates, existingStudent.toObject());
        for (const key of studentFields) {
          if (updates[key] !== undefined) studentUpdates[key] = updates[key];
        }
        const filledCount = fields.filter(f => studentUpdates[f] && studentUpdates[f].toString().trim()).length;
        studentUpdates.profileCompleted = Math.round((filledCount / fields.length) * 100);
        await Student.findOneAndUpdate({ userId }, studentUpdates, { new: true });
      }
    }
  }

  return { user };
};

module.exports = { register, login, refreshUserToken, updateProfile };
