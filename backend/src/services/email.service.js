const nodemailer = require('nodemailer');
const env = require('../config/env');
const crypto = require('crypto');
const {
  verifyRecipient,
  isValidEmailFormat,
  DELIVERY_STATUS,
} = require('../utils/emailValidation');

let transporter = null;

// ─────────────────────────────────────────────
// Delivery Status Log
// ─────────────────────────────────────────────
const _deliveryLog = [];

const logDelivery = (entry) => {
  _deliveryLog.push({ ...entry, timestamp: new Date().toISOString() });
  console.log('[Email Delivery]', JSON.stringify({ deliveryId: entry.deliveryId, flow: entry.flow || 'unknown', to: entry.to, subject: entry.subject, status: entry.status, passed: entry.passed }));
};

const getDeliveryLog = () => [..._deliveryLog];

// ─────────────────────────────────────────────
// Transport
// ─────────────────────────────────────────────

const getTransporter = async () => {
  if (transporter) return transporter;

  if (env.smtpUser && env.smtpPass) {
    // Real SMTP (Gmail App Password)
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.smtpUser, pass: env.smtpPass },
      connectionTimeout: 10000,
      socketTimeout: 30000,
    });
    console.log('[Email] Using Gmail SMTP:', env.smtpUser);
  } else if (env.isDev) {
    // Development fallback: Ethereal fake SMTP (only in dev mode)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[Email] Using Ethereal dev SMTP. Preview emails at: https://ethereal.email/login');
  } else {
    throw new Error('SMTP not configured. Set SMTP_USER and SMTP_PASS in .env for production.');
  }

  // Verify transport (non-blocking - don't await, first email send shouldn't wait for verification)
  transporter.verify().then(function() {
    console.log('[Email] Transport verified successfully.');
  }).catch(function(err) {
    console.error('[Email] Transport verification failed:', err.message);
  });

  return transporter;
};

// ─────────────────────────────────────────────
// Send Email with Delivery Tracking
// ─────────────────────────────────────────────

/**
 * Send email with delivery validation.
 *
 * Delivery statuses:
 * - SMTP_ACCEPTED: SMTP server accepted the message (nodemailer sendMail succeeded)
 * - DELIVERED:     Delivery confirmed (requires webhook/feedback loop)
 * - BOUNCED:       Message bounced (detectable via SMTP response codes)
 * - INVALID:       Recipient failed pre-send validation (format, domain, MX records)
 * - UNKNOWN:       Cannot determine delivery status
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const deliveryId = crypto.randomBytes(8).toString('hex');

  // Step 1: Validate recipient before attempting to send
  const validation = await verifyRecipient(to);

  if (!validation.valid) {
    logDelivery({
      deliveryId,
      flow: 'unknown',
      to,
      subject,
      status: DELIVERY_STATUS.INVALID,
      smtpResponse: null,
      validation: validation.details,
      messageId: null,
      passed: false,
    });
    console.error('[Email] BLOCKED: "' + subject + '" to ' + to + ' \u2014 ' + validation.details);
    // In dev mode, throw so callers catch and handle the failure
    if (env.isDev && !env.smtpUser) {
      const err = new Error('Email blocked: ' + validation.details);
      err.deliveryStatus = DELIVERY_STATUS.INVALID;
      err.validation = validation;
      err.deliveryId = deliveryId;
      throw err;
    }
    return { deliveryId, status: DELIVERY_STATUS.INVALID, validation };
  }

  // Step 2: Send via SMTP
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: env.smtpFrom || '"PlaceMux" <noreply@placemux.com>',
      to,
      subject,
      text,
      html: html || text,
    });

    // In dev (Ethereal), show preview URL
    if (env.isDev && !env.smtpUser) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('[Email] Preview URL:', previewUrl);
      }
    }

    // SMTP accepted the message \u2014 this is NOT the same as delivered
    const deliveryStatus = {
      deliveryId,
      flow: 'unknown',
      to,
      subject,
      status: DELIVERY_STATUS.SMTP_ACCEPTED,
      smtpResponse: info.response || '',
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      validation: validation.details,
      passed: true,
    };

    // Check if any recipients were rejected at SMTP level
    if (info.rejected && info.rejected.length > 0) {
      deliveryStatus.status = DELIVERY_STATUS.BOUNCED;
      deliveryStatus.passed = false;
      console.error('[Email] BOUNCED: "' + subject + '" to ' + to + ' \u2014 SMTP rejected: ' + info.rejected.join(', '));
    } else {
      console.log('[Email] SMTP_ACCEPTED: "' + subject + '" to ' + to + ' (messageId: ' + info.messageId + ')');
    }

    logDelivery(deliveryStatus);
    return { ...info, deliveryId, deliveryStatus: deliveryStatus.status };
  } catch (err) {
    // Nodemailer error \u2014 could be a bounce, connection error, auth error, etc.
    const isBounce = err.message && (
      err.message.includes('550') ||
      err.message.includes('551') ||
      err.message.includes('552') ||
      err.message.includes('553') ||
      err.message.includes('450') ||
      err.message.toLowerCase().includes('no such user') ||
      err.message.toLowerCase().includes('user unknown') ||
      err.message.toLowerCase().includes('mailbox unavailable') ||
      err.message.toLowerCase().includes('does not exist')
    );

    const status = isBounce ? DELIVERY_STATUS.BOUNCED : DELIVERY_STATUS.UNKNOWN;

    logDelivery({
      deliveryId,
      flow: 'unknown',
      to,
      subject,
      status,
      smtpResponse: err.message,
      messageId: null,
      validation: validation.details,
      passed: false,
    });

    console.error('[Email] ' + (isBounce ? 'BOUNCED' : 'FAILED') + ': "' + subject + '" to ' + to + ': ' + err.message);

    // Attach delivery metadata to error
    err.deliveryStatus = status;
    err.deliveryId = deliveryId;
    throw err;
  }
};

module.exports = { sendEmail, getTransporter, getDeliveryLog };
