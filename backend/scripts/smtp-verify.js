/**
 * SMTP Delivery Verification Script
 * Steps 1-5: Load .env, verify SMTP, send test emails, show results
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

const TEST_RECIPIENTS = [
  'shabirsk989+admin@gmail.com',
  'shabirsk989+student@gmail.com',
  'shabirsk989+company@gmail.com',
  'shabirsk989+college@gmail.com',
];

function printSection(title) {
  console.log('\n' + '='.repeat(70));
  console.log('  ' + title);
  console.log('='.repeat(70));
}

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     SMTP DELIVERY VERIFICATION                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log('Started: ' + new Date().toISOString());

  // STEP 1 & 2: Load .env and verify SMTP credentials
  printSection('STEP 1 & 2: Load .env & Verify SMTP Credentials');

  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const smtpFrom = process.env.SMTP_FROM || '';

  console.log('  SMTP_USER detected:      ' + (smtpUser ? 'YES - ' + smtpUser : 'NO'));
  console.log('  SMTP_PASS detected:      ' + (smtpPass ? 'YES - ' + smtpPass.substring(0, 6) + '...' : 'NO'));
  console.log('  SMTP_FROM detected:      ' + (smtpFrom ? 'YES - ' + smtpFrom : 'NO'));

  if (!smtpUser || !smtpPass) {
    console.error('\n  FATAL: SMTP_USER or SMTP_PASS not set in .env');
    process.exit(1);
  }

  // STEP 3: Create transporter and verify
  printSection('STEP 3: Create Gmail SMTP Transporter & Verify');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    const verifyResult = await transporter.verify();
    console.log('  transporter.verify() result:', verifyResult);
    console.log('  SMTP connection VERIFIED successfully!');
  } catch (err) {
    console.error('  SMTP verification FAILED:', err.message);
    process.exit(1);
  }

  // STEP 4 & 5: Send test emails and show results
  printSection('STEP 4 & 5: Send Test Emails & Show Results');

  const results = [];

  for (const email of TEST_RECIPIENTS) {
    console.log('\n  --- Sending test email to: ' + email + ' ---');

    try {
      const info = await transporter.sendMail({
        from: smtpFrom || '"PlaceMux" <' + smtpUser + '>',
        to: email,
        subject: 'SMTP Delivery Test - ' + new Date().toISOString(),
        text: 'This is a test email to verify SMTP delivery from PlaceMux platform.\n\n' +
              'Sent at: ' + new Date().toISOString() + '\n' +
              'Recipient: ' + email + '\n\n' +
              'If you received this email, SMTP delivery is working correctly!',
        html: '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">' +
              '<h1 style="color:#2563eb;text-align:center;">SMTP Delivery Test</h1>' +
              '<p>This is a test email to verify SMTP delivery from <strong>PlaceMux</strong>.</p>' +
              '<table style="width:100%;border-collapse:collapse;margin:15px 0;">' +
              '<tr><td style="padding:8px;border-bottom:1px solid #e0e0e0;color:#666;">Sent at</td><td style="padding:8px;border-bottom:1px solid #e0e0e0;font-weight:bold;">' + new Date().toISOString() + '</td></tr>' +
              '<tr><td style="padding:8px;border-bottom:1px solid #e0e0e0;color:#666;">Recipient</td><td style="padding:8px;border-bottom:1px solid #e0e0e0;font-weight:bold;">' + email + '</td></tr>' +
              '</table>' +
              '<div style="background-color:#d1fae5;border:1px solid #059669;border-radius:6px;padding:12px;text-align:center;margin:15px 0;">' +
              '<p style="color:#065f46;font-weight:bold;margin:0;">SMTP delivery is working correctly!</p>' +
              '</div>' +
              '</div>',
      });

      results.push({
        email,
        success: true,
        accepted: info.accepted || [],
        rejected: info.rejected || [],
        response: info.response || '',
        messageId: info.messageId || '',
      });

      console.log('  EMAIL SENT SUCCESSFULLY');
      console.log('  accepted[]:    ' + JSON.stringify(info.accepted || []));
      console.log('  rejected[]:    ' + JSON.stringify(info.rejected || []));
      console.log('  response:      ' + (info.response || 'N/A'));
      console.log('  messageId:     ' + (info.messageId || 'N/A'));

    } catch (err) {
      results.push({
        email,
        success: false,
        accepted: [],
        rejected: [email],
        response: err.message,
        messageId: '',
      });

      console.log('  EMAIL FAILED');
      console.log('  error:         ' + err.message);
    }
  }

  // FINAL SUMMARY
  printSection('DELIVERY VERIFICATION SUMMARY');
  console.log('');
  console.log('  Email                           Status    MessageId');
  console.log('  ' + '-'.repeat(75));
  for (const r of results) {
    const status = r.success ? 'PASS' : 'FAIL';
    const mid = r.messageId ? (r.messageId.length > 40 ? r.messageId.substring(0, 40) + '...' : r.messageId) : 'N/A';
    console.log('  ' + r.email.padEnd(35) + ' ' + status.padEnd(10) + ' ' + mid);
  }
  console.log('');
  const passed = results.filter(r => r.success).length;
  console.log('  TOTAL: ' + passed + '/' + results.length + ' emails sent successfully\n');

  printSection('DETAILED SMTP RESPONSE BREAKDOWN');
  for (const r of results) {
    console.log('');
    console.log('  -- ' + r.email + ' --');
    console.log('  Status:        ' + (r.success ? 'PASS' : 'FAIL'));
    console.log('  accepted[]:    ' + JSON.stringify(r.accepted));
    console.log('  rejected[]:    ' + JSON.stringify(r.rejected));
    console.log('  response:      ' + (r.response || 'N/A'));
    console.log('  messageId:     ' + (r.messageId || 'N/A'));
  }

  console.log('\n  SMTP Verification completed: ' + new Date().toISOString());
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err);
  process.exit(1);
});
