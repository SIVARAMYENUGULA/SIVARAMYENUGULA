const { StudentSettings, Student } = require('../models');

exports.getSettings = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    let settings = await StudentSettings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = await StudentSettings.create({ studentId: student._id, userId: req.user._id });
    }
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(403).json({ success: false, error: { code: 'NO_STUDENT_PROFILE', message: 'Student profile required.' } });
    const { notifications, privacy, preferences } = req.body;
    const updateData = {};
    if (notifications) updateData.notifications = notifications;
    if (privacy) updateData.privacy = privacy;
    if (preferences) updateData.preferences = preferences;
    const settings = await StudentSettings.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: settings, message: 'Settings updated.' });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { User } = require('../models');
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, error: { code: 'WRONG_PASSWORD', message: 'Current password is incorrect.' } });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};
