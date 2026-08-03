const { Job, Company } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const { status, type, skills, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (skills) filter.skillsRequired = { $in: skills.split(',') };
    if (search) filter.title = { $regex: search, $options: 'i' };
    
    // College role sees only active jobs by default
    if (req.user.role === 'college' && !status) filter.status = 'active';
    
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
    let company;
    if (req.user.role === 'company') {
      company = await Company.findOne({ userId: req.user._id });
      if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
    }
    const jobData = { ...req.body };
    if (company) jobData.companyId = company._id;
    const job = await Job.create(jobData);
    res.status(201).json({ success: true, data: job, message: 'Job created.' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    // Company role: only update own jobs
    if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
      query.companyId = company._id;
    }
    const job = await Job.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found.' } });
    res.json({ success: true, data: job, message: 'Job updated.' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (!company) return res.status(403).json({ success: false, error: { code: 'NO_COMPANY_PROFILE', message: 'Company profile required.' } });
      query.companyId = company._id;
    }
    const job = await Job.findOneAndDelete(query);
    if (!job) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found or not owned by you.' } });
    res.json({ success: true, message: 'Job deleted.' });
  } catch (err) { next(err); }
};

exports.recommended = async (req, res, next) => {
  try {
    const { Student, SkillPassport } = require('../models');
    // If student, recommend based on skills
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      const skillPassport = await SkillPassport.findOne({ studentId: student._id });
      const studentSkills = skillPassport ? skillPassport.skills.map(s => s.name.toLowerCase()) : [];
      
      let filter = { status: 'active' };
      if (studentSkills.length > 0) {
        filter.skillsRequired = { $in: studentSkills };
      }
      const jobs = await Job.find(filter)
        .populate({ path: 'companyId', select: 'companyName industry logoUrl location' })
        .sort({ postedAt: -1 })
        .limit(10);
      res.json({ success: true, data: jobs });
    } else {
      // For non-students, return recent active jobs
      const jobs = await Job.find({ status: 'active' })
        .populate({ path: 'companyId', select: 'companyName industry logoUrl location' })
        .sort({ postedAt: -1 })
        .limit(10);
      res.json({ success: true, data: jobs });
    }
  } catch (err) { next(err); }
};