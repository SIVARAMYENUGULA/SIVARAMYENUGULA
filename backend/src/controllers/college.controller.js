const { College, Student, User, Job, Application, Interview, Company, Drive, Score, Assessment } = require('../models');

exports.dashboard = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const totalStudents = await Student.countDocuments({ collegeId: college._id });
    const studentIds = (await Student.find({ collegeId: college._id }).select('_id')).map(s => s._id);
    const placedStudents = await Application.distinct('studentId', { studentId: { $in: studentIds }, status: 'Accepted' });
    const placedCount = placedStudents.length;
    const placementRate = totalStudents > 0 ? Math.round((placedCount / totalStudents) * 10000) / 100 : 0;
    const totalApplications = await Application.countDocuments({ studentId: { $in: studentIds } });
    const interviews = await Interview.find({ studentId: { $in: studentIds } });
    const upcomingInterviews = interviews.filter(i => i.status === 'Scheduled').length;
    const totalDrives = await Drive.countDocuments({ collegeId: college._id, status: { $ne: 'draft' } });
    const activeDrives = await Drive.countDocuments({ collegeId: college._id, status: 'published' });
    const avgPackage = await computeAvgPackage(studentIds);
    res.json({ success: true, data: { totalStudents, placedCount, placementRate, totalApplications, upcomingInterviews, totalDrives, activeDrives, averagePackage: avgPackage } });
  } catch (err) { next(err); }
};

exports.students = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const { page = 1, limit = 50, search } = req.query;
    const filter = { collegeId: college._id };
    if (search) filter.$or = [ { course: { $regex: search, $options: 'i' } }, { 'userName': { $regex: search, $options: 'i' } } ];
    const students = await Student.find(filter).populate('userId', 'name email').skip((page - 1) * limit).limit(parseInt(limit)).sort({ createdAt: -1 });
    const studentIds = students.map(s => s._id);
    const acceptedApps = await Application.find({ studentId: { $in: studentIds }, status: 'Accepted' }).populate('jobId', 'title');
    const acceptedMap = {};
    acceptedApps.forEach(a => { acceptedMap[a.studentId.toString()] = a; });
    const allApps = await Application.find({ studentId: { $in: studentIds } });
    const appCountMap = {};
    allApps.forEach(a => { const id = a.studentId.toString(); appCountMap[id] = (appCountMap[id] || 0) + 1; });
    const interviewCounts = await Interview.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: '$studentId', count: { $sum: 1 } } }
    ]);
    const intCountMap = {};
    interviewCounts.forEach(i => { intCountMap[i._id.toString()] = i.count; });
    const data = students.map(s => ({
      _id: s._id, name: s.userId?.name || 'Unknown', email: s.userId?.email || '',
      course: s.course || '', year: s.year || 0, phone: s.phone || '',
      placed: !!acceptedMap[s._id.toString()],
      placedAt: acceptedMap[s._id.toString()]?.jobId?.title || '',
      profileCompleted: s.profileCompleted || 0,
      applicationCount: appCountMap[s._id.toString()] || 0,
      interviewCount: intCountMap[s._id.toString()] || 0,
    }));
    const total = await Student.countDocuments(filter);
    res.json({ success: true, data, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.studentDetail = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const student = await Student.findById(req.params.id).populate('userId', 'name email avatar');
    if (!student || !student.collegeId || student.collegeId.toString() !== college._id.toString()) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found.' } });
    }
    const applications = await Application.find({ studentId: student._id }).populate('jobId', 'title companyId').populate('jobId.companyId', 'companyName');
    const assessments = await Score.find({ studentId: student._id }).populate('assessmentId', 'title type').sort({ completedAt: -1 }).limit(10);
    const interviews = await Interview.find({ studentId: student._id }).populate('companyId', 'companyName').populate('jobId', 'title').sort({ date: -1 });
    const skills = await (require('../models/SkillPassport')).findOne({ studentId: student._id });
    res.json({ success: true, data: { student: { _id: student._id, name: student.userId?.name, email: student.userId?.email, avatar: student.userId?.avatar, course: student.course, year: student.year, phone: student.phone, bio: student.bio, resumeUrl: student.resumeUrl, linkedinUrl: student.linkedinUrl, portfolioUrl: student.portfolioUrl, profileCompleted: student.profileCompleted }, applications, assessments, interviews, skills: skills?.skills || [] } });
  } catch (err) { next(err); }
};

exports.companies = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const studentIds = (await Student.find({ collegeId: college._id }).select('_id')).map(s => s._id);
    const jobIds = await Application.distinct('jobId', { studentId: { $in: studentIds } });
    const jobs = await Job.find({ _id: { $in: jobIds } });
    const companyIdSet = [...new Set(jobs.map(j => j.companyId.toString()))];
    const companies = await Company.find({ _id: { $in: companyIdSet } }).populate('userId', 'name email');
    const companyData = [];
    for (const c of companies) {
      const cJobs = jobs.filter(j => j.companyId.toString() === c._id.toString());
      const cJobIds = cJobs.map(j => j._id);
      const cApplications = await Application.countDocuments({ jobId: { $in: cJobIds }, studentId: { $in: studentIds } });
      const cPlaced = await Application.countDocuments({ jobId: { $in: cJobIds }, studentId: { $in: studentIds }, status: 'Accepted' });
      const cDrives = await Drive.countDocuments({ collegeId: college._id, companyId: c._id });
      companyData.push({
        _id: c._id, companyName: c.companyName || c.userId?.name || 'Unknown', industry: c.industry, location: c.location, website: c.website, logoUrl: c.logoUrl,
        activeJobs: cJobs.filter(j => j.status === 'active').length,
        totalJobs: cJobs.length, applications: cApplications, placed: cPlaced, drives: cDrives,
      });
    }
    res.json({ success: true, data: companyData.sort((a, b) => b.applications - a.applications) });
  } catch (err) { next(err); }
};

exports.companyDetail = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const company = await Company.findById(req.params.id).populate('userId', 'name email');
    if (!company) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found.' } });
    const jobs = await Job.find({ companyId: company._id });
    const studentIds = (await Student.find({ collegeId: college._id }).select('_id')).map(s => s._id);
    const jobIds = jobs.map(j => j._id);
    const applications = await Application.find({ jobId: { $in: jobIds }, studentId: { $in: studentIds } }).populate('studentId').populate('jobId', 'title');
    const placed = applications.filter(a => a.status === 'Accepted');
    const drives = await Drive.find({ collegeId: college._id, companyId: company._id }).populate('jobId', 'title').sort({ createdAt: -1 });
    res.json({ success: true, data: { company: { _id: company._id, companyName: company.companyName || company.userId?.name, industry: company.industry, location: company.location, website: company.website, description: company.description, logoUrl: company.logoUrl }, jobs, applications, placedCount: placed.length, drives } });
  } catch (err) { next(err); }
};

exports.analytics = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const studentIds = (await Student.find({ collegeId: college._id }).select('_id')).map(s => s._id);
    const students = await Student.find({ collegeId: college._id }).populate('userId', 'name email');
    const deptData = {};
    for (const s of students) {
      const dept = s.course || 'Unknown';
      if (!deptData[dept]) deptData[dept] = { total: 0, placed: 0 };
      deptData[dept].total++;
    }
    const acceptedApps = await Application.find({ studentId: { $in: studentIds }, status: 'Accepted' });
    const placedIds = new Set(acceptedApps.map(a => a.studentId.toString()));
    for (const s of students) {
      const dept = s.course || 'Unknown';
      if (placedIds.has(s._id.toString())) deptData[dept].placed++;
    }
    const departmentData = Object.entries(deptData).map(([name, d]) => ({
      name, placed: d.total > 0 ? Math.round((d.placed / d.total) * 100) : 0, total: d.total,
    }));
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentApps = await Application.find({ studentId: { $in: studentIds }, appliedAt: { $gte: sixMonthsAgo } });
    const monthlyData = {};
    for (const a of recentApps) {
      const key = a.appliedAt ? a.appliedAt.toISOString().substring(0, 7) : '';
      if (!key) continue;
      if (!monthlyData[key]) monthlyData[key] = { applications: 0, shortlisted: 0 };
      monthlyData[key].applications++;
      if (a.status === 'Shortlisted' || a.status === 'Interview') monthlyData[key].shortlisted++;
    }
    const trendData = Object.entries(monthlyData).sort().map(([month, d]) => ({
      month: new Date(month + '-01').toLocaleString('en-US', { month: 'short' }), ...d,
    }));
    const placedCount = placedIds.size;
    const placementRate = studentIds.length > 0 ? Math.round((placedCount / studentIds.length) * 100) : 0;
    const avgPackage = await computeAvgPackage(studentIds);
    const highestPackage = await computeHighestPackage(studentIds);
    const lowestPackage = await computeLowestPackage(studentIds);
    const sectorData = await computeSectorData(studentIds);
    res.json({ success: true, data: { totalStudents: studentIds.length, placedCount, placementRate, departmentData, trendData, averagePackage: avgPackage, highestPackage, lowestPackage, sectorData } });
  } catch (err) { next(err); }
};

exports.assessmentReports = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const studentIds = (await Student.find({ collegeId: college._id }).select('_id')).map(s => s._id);
    const scores = await Score.find({ studentId: { $in: studentIds } }).populate('studentId', 'userId').populate('assessmentId', 'title type');
    const totalAssessments = scores.length;
    const passedCount = scores.filter(s => s.passed).length;
    const passRate = totalAssessments > 0 ? Math.round((passedCount / totalAssessments) * 100) : 0;
    const avgScore = totalAssessments > 0 ? Math.round(scores.reduce((sum, s) => sum + (s.percentage || 0), 0) / totalAssessments) : 0;
    const deptScores = {};
    for (const s of scores) {
      if (s.studentId) {
        const student = await Student.findById(s.studentId._id || s.studentId);
        const dept = student?.course || 'Unknown';
        if (!deptScores[dept]) deptScores[dept] = { total: 0, count: 0 };
        deptScores[dept].total += s.percentage || 0;
        deptScores[dept].count++;
      }
    }
    const deptAvgScores = Object.entries(deptScores).map(([name, d]) => ({ name, avgScore: d.count > 0 ? Math.round(d.total / d.count) : 0, count: d.count }));
    const topPerformers = await Score.find({ studentId: { $in: studentIds } }).populate('studentId', 'userId').populate('assessmentId', 'title').sort({ percentage: -1 }).limit(10);
    const topData = [];
    for (const s of topPerformers) {
      if (s.studentId) {
        const student = await Student.findById(s.studentId._id || s.studentId).populate('userId', 'name');
        topData.push({ studentName: student?.userId?.name || 'Unknown', assessmentTitle: s.assessmentId?.title || 'Unknown', percentage: s.percentage, grade: s.grade });
      }
    }
    res.json({ success: true, data: { totalAssessments, passedCount, passRate, avgScore, deptAvgScores, topPerformers: topData, recentScores: scores.slice(0, 50) } });
  } catch (err) { next(err); }
};

exports.salaryAnalytics = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const studentIds = (await Student.find({ collegeId: college._id }).select('_id')).map(s => s._id);
    const acceptedApps = await Application.find({ studentId: { $in: studentIds }, status: 'Accepted' }).populate('jobId');
    let totalSalary = 0; let count = 0; let highest = 0; let lowest = Infinity;
    const companyPackages = {}; const deptPackages = {};
    for (const app of acceptedApps) {
      if (!app.jobId || !app.jobId.salaryMax) continue;
      const salary = (app.jobId.salaryMax + (app.jobId.salaryMin || 0)) / 2;
      totalSalary += salary; count++;
      if (salary > highest) highest = salary;
      if (salary < lowest) lowest = salary;
      const companyName = app.jobId.companyId?.toString() || 'Unknown';
      if (!companyPackages[companyName]) companyPackages[companyName] = { total: 0, count: 0 };
      companyPackages[companyName].total += salary; companyPackages[companyName].count++;
      const student = await Student.findById(app.studentId);
      if (student) {
        const dept = student.course || 'Unknown';
        if (!deptPackages[dept]) deptPackages[dept] = { total: 0, count: 0 };
        deptPackages[dept].total += salary; deptPackages[dept].count++;
      }
    }
    const companyWise = Object.entries(companyPackages).map(([name, d]) => ({ companyName: name, avgPackage: Math.round(d.total / d.count), count: d.count }));
    const branchWise = Object.entries(deptPackages).map(([name, d]) => ({ branch: name, avgPackage: Math.round(d.total / d.count), count: d.count }));
    res.json({ success: true, data: { averagePackage: count > 0 ? Math.round(totalSalary / count) : 0, highestPackage: highest || 0, lowestPackage: lowest === Infinity ? 0 : Math.round(lowest), companyWise, branchWise, totalPlaced: count } });
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────────
// Domain Management — Enterprise college-student association
// ──────────────────────────────────────────────────

/**
 * GET /college/domains
 * Returns the list of email domains registered for this college.
 */
exports.getDomains = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    res.json({ success: true, data: { emailDomains: college.emailDomains || [] } });
  } catch (err) { next(err); }
};

/**
 * PUT /college/domains
 * Replaces the full list of email domains for this college.
 * Body: { emailDomains: ["college.edu", "iitb.ac.in"] }
 */
exports.updateDomains = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const { emailDomains } = req.body;
    if (!Array.isArray(emailDomains)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'emailDomains must be an array of strings.' } });
    }
    // Normalize: trim and lowercase
    const normalized = emailDomains.map(d => d.trim().toLowerCase()).filter(Boolean);
    college.emailDomains = [...new Set(normalized)];
    await college.save();
    // After updating domains, run a silent re-link for all existing students whose email matches
    await relinkStudentsForCollege(college._id);
    res.json({ success: true, data: { emailDomains: college.emailDomains }, message: 'Email domains updated. Existing students re-linked.' });
  } catch (err) { next(err); }
};

/**
 * POST /college/domains/link
 * Manually trigger re-linking of all students whose email domain matches this college.
 */
exports.relinkStudents = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    const linked = await relinkStudentsForCollege(college._id);
    res.json({ success: true, data: { linkedCount: linked }, message: `Re-linked ${linked} students to this college.` });
  } catch (err) { next(err); }
};

/**
 * POST /college/domains/suggest
 * Returns suggested domains based on existing student email addresses
 * that are NOT currently linked to any college.
 */
exports.suggestDomains = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.user._id });
    if (!college) return res.status(403).json({ success: false, error: { code: 'NO_COLLEGE_PROFILE', message: 'College profile required.' } });
    // Find all students who are not linked to any college
    const unlinkedStudents = await Student.find({ collegeId: { $in: [null, undefined] } }).populate('userId', 'email');
    const domainCounts = {};
    for (const s of unlinkedStudents) {
      if (s.userId?.email) {
        const parts = s.userId.email.split('@');
        if (parts.length > 1) {
          const domain = parts[1].toLowerCase();
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
      }
    }
    const suggestions = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);
    res.json({ success: true, data: { suggestions } });
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────────
// Helper: re-link all students whose email domains match the college
// ──────────────────────────────────────────────────
async function relinkStudentsForCollege(collegeId) {
  const college = await College.findById(collegeId);
  if (!college || !college.emailDomains || college.emailDomains.length === 0) return 0;
  const domains = college.emailDomains.map(d => d.toLowerCase());
  // Find all users with student role whose email domain matches
  const users = await User.find({ role: 'student' }).lean();
  let linkedCount = 0;
  for (const user of users) {
    const emailParts = user.email.split('@');
    if (emailParts.length < 2) continue;
    const userDomain = emailParts[1].toLowerCase();
    const matches = domains.some(d => userDomain === d || userDomain.endsWith('.' + d));
    if (matches) {
      const result = await Student.updateOne(
        { userId: user._id },
        { $set: { collegeId: collegeId } }
      );
      if (result.modifiedCount > 0) linkedCount++;
    }
  }
  return linkedCount;
}

// ──────────────────────────────────────────────────
// Existing helpers (unchanged)
// ──────────────────────────────────────────────────
async function computeAvgPackage(studentIds) {
  const acceptedApps = await Application.find({ studentId: { $in: studentIds }, status: 'Accepted' }).populate('jobId');
  let total = 0; let count = 0;
  for (const app of acceptedApps) {
    if (app.jobId && app.jobId.salaryMax) {
      total += (app.jobId.salaryMax + (app.jobId.salaryMin || 0)) / 2; count++;
    }
  }
  return count > 0 ? Math.round(total / count) : 0;
}

async function computeHighestPackage(studentIds) {
  const acceptedApps = await Application.find({ studentId: { $in: studentIds }, status: 'Accepted' }).populate('jobId');
  let highest = 0;
  for (const app of acceptedApps) {
    if (app.jobId && app.jobId.salaryMax && app.jobId.salaryMax > highest) highest = app.jobId.salaryMax;
  }
  return highest;
}

async function computeLowestPackage(studentIds) {
  const acceptedApps = await Application.find({ studentId: { $in: studentIds }, status: 'Accepted' }).populate('jobId');
  let lowest = Infinity;
  for (const app of acceptedApps) {
    if (app.jobId && app.jobId.salaryMin && app.jobId.salaryMin < lowest) lowest = app.jobId.salaryMin;
  }
  return lowest === Infinity ? 0 : lowest;
}

async function computeSectorData(studentIds) {
  const acceptedApps = await Application.find({ studentId: { $in: studentIds }, status: 'Accepted' }).populate('jobId');
  const sectors = {};
  for (const app of acceptedApps) {
    if (app.jobId) {
      const job = await Job.findById(app.jobId._id || app.jobId).populate('companyId');
      const industry = job?.companyId?.industry || 'Other';
      if (!sectors[industry]) sectors[industry] = 0;
      sectors[industry]++;
    }
  }
  const colors = ['#6c5ce7', '#a29bfe', '#74b9ff', '#00b894', '#fdcb6e', '#e17055', '#00cec9', '#fd79a8'];
  return Object.entries(sectors).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
}
