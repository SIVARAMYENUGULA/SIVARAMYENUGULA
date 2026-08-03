const { SkillPassport, Student } = require('../models');

exports.getSkills = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    let passport = await SkillPassport.findOne({ studentId: student._id });
    if (!passport) {
      passport = await SkillPassport.create({ studentId: student._id, skills: [], overallScore: 0, lastUpdated: new Date() });
    }
    res.json({ success: true, data: passport });
  } catch (err) { next(err); }
};

exports.addSkill = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    let passport = await SkillPassport.findOne({ studentId: student._id });
    if (!passport) passport = await SkillPassport.create({ studentId: student._id, skills: [], overallScore: 0, lastUpdated: new Date() });
    const { name, category, level } = req.body;
    if (!name || !category || !level) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'name, category, and level are required.' } });
    passport.skills.push({ name, category, level, endorsements: 0, assessedAt: new Date() });
    const totalLevel = passport.skills.reduce((sum, s) => sum + (s.level === 'Expert' ? 100 : s.level === 'Advanced' ? 75 : s.level === 'Intermediate' ? 50 : 25), 0);
    passport.overallScore = Math.round(totalLevel / passport.skills.length);
    passport.lastUpdated = new Date();
    await passport.save();
    res.status(201).json({ success: true, data: passport, message: 'Skill added.' });
  } catch (err) { next(err); }
};

exports.updateSkill = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    const passport = await SkillPassport.findOne({ studentId: student._id });
    if (!passport) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No skills found.' } });
    const skill = passport.skills.id(req.params.skillId);
    if (!skill) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Skill not found.' } });
    const { name, category, level } = req.body;
    if (name) skill.name = name;
    if (category) skill.category = category;
    if (level) skill.level = level;
    const totalLevel = passport.skills.reduce((sum, s) => sum + (s.level === 'Expert' ? 100 : s.level === 'Advanced' ? 75 : s.level === 'Intermediate' ? 50 : 25), 0);
    passport.overallScore = Math.round(totalLevel / passport.skills.length);
    passport.lastUpdated = new Date();
    await passport.save();
    res.json({ success: true, data: passport, message: 'Skill updated.' });
  } catch (err) { next(err); }
};

exports.deleteSkill = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    const passport = await SkillPassport.findOne({ studentId: student._id });
    if (!passport) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No skills found.' } });
    passport.skills.pull({ _id: req.params.skillId });
    if (passport.skills.length > 0) {
      const totalLevel = passport.skills.reduce((sum, s) => sum + (s.level === 'Expert' ? 100 : s.level === 'Advanced' ? 75 : s.level === 'Intermediate' ? 50 : 25), 0);
      passport.overallScore = Math.round(totalLevel / passport.skills.length);
    } else {
      passport.overallScore = 0;
    }
    passport.lastUpdated = new Date();
    await passport.save();
    res.json({ success: true, data: passport, message: 'Skill deleted.' });
  } catch (err) { next(err); }
};
