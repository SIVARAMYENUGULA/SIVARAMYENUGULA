const { Notification } = require('../models');
const { sendEmail } = require('./email.service');

const createNotification = async (userId, title, message, type = 'info', link = '', metadata = {}) => {
  return Notification.create({ userId, title, message, type, link, metadata });
};

const notifyApplicationUpdate = async (studentId, jobTitle, companyName, status) => {
  const messages = {
    Applied: 'You applied to ' + jobTitle + ' at ' + companyName,
    Shortlisted: 'Your application for ' + jobTitle + ' has been shortlisted!',
    Interview: 'You have been called for an interview for ' + jobTitle,
    Accepted: 'Congratulations! Your application for ' + jobTitle + ' has been accepted!',
    Rejected: 'Your application for ' + jobTitle + ' was not selected.',
  };
  const message = messages[status] || 'Status updated to ' + status;
  
  // Create in-app notification
  await createNotification(
    studentId, 'Application ' + status, message,
    status === 'Accepted' ? 'success' : status === 'Rejected' ? 'error' : 'info'
  );
  
  // Send email notification
  try {
    const { User } = require('../models');
    const user = await User.findById(studentId);
    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Application Update - ' + jobTitle,
        html: '<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8f9fa; border-radius: 12px;">'
          + '<div style="text-align: center; margin-bottom: 24px;"><h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">PlaceMux</h1><p style="color: #6b7280; margin: 4px 0 0 0;">Application Update</p></div>'
          + '<div style="background: white; border-radius: 8px; padding: 24px; text-align: center;">'
          + '<h2 style="color: #1a1a2e; font-size: 18px; margin: 0 0 16px;">' + status + '</h2>'
          + '<p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;">' + message + '</p>'
          + '<p style="color: #9ca3af; font-size: 12px; margin: 0;">Log in to PlaceMux for more details.</p>'
          + '</div></div>',
      });
    }
  } catch (err) {
    console.error('[Notification] Failed to send email:', err.message);
  }
};

const notifyInterviewScheduled = async (userEmail, userName, jobTitle, date, time) => {
  try {
    await sendEmail({
      to: userEmail,
      subject: 'Interview Scheduled - ' + jobTitle,
      html: '<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8f9fa; border-radius: 12px;">'
        + '<div style="text-align: center; margin-bottom: 24px;"><h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">PlaceMux</h1><p style="color: #6b7280; margin: 4px 0 0 0;">Interview Scheduled</p></div>'
        + '<div style="background: white; border-radius: 8px; padding: 24px; text-align: center;">'
        + '<h2 style="color: #1a1a2e; font-size: 18px; margin: 0 0 16px;">Interview Scheduled</h2>'
        + '<p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;">Hi ' + userName + ',</p>'
        + '<p style="color: #4b5563; font-size: 14px; margin: 0 0 16px;">Your interview for <strong>' + jobTitle + '</strong> has been scheduled.</p>'
        + '<div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 0 auto 16px; display: inline-block;">'
        + '<p style="margin: 0 0 4px; color: #374151;"><strong>Date:</strong> ' + date + '</p>'
        + '<p style="margin: 0; color: #374151;"><strong>Time:</strong> ' + time + '</p>'
        + '</div>'
        + '<p style="color: #9ca3af; font-size: 12px; margin: 0;">Log in to PlaceMux for more details.</p>'
        + '</div></div>',
    });
  } catch (err) {
    console.error('[Notification] Failed to send interview email:', err.message);
  }
};

module.exports = { createNotification, notifyApplicationUpdate, notifyInterviewScheduled };
