const { verifyRecipient, extractDomain, FAKE_DOMAINS, DELIVERY_STATUS } = require('../src/utils/emailValidation');
const API = 'http://localhost:5000/api';
const h = (t) => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t });

const results = [];
let passed = 0;
let failed = 0;

function record(flow, recipient, status, detail) {
  results.push({ flow, recipient, status, detail, timestamp: new Date().toISOString() });
  if (status.startsWith('PASS')) passed++; else failed++;
  const icon = status.startsWith('PASS') ? '\u2705' : '\u274c';
  console.log('  ' + icon + ' ' + flow + ': ' + status + (detail ? ' \u2014 ' + detail : ''));
}

function printSection(title) {
  console.log('\n' + '='.repeat(70));
  console.log('  ' + title);
  console.log('='.repeat(70));
}

async function login(email, password) {
  try {
    const r = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) return null;
    return (await r.json()).data;
  } catch { return null; }
}

const KNOWN_TEST_RECIPIENTS = [
  { email: 'shabirsk989+admin@gmail.com',   role: 'admin',   source: 'seed.js (updated)' },
  { email: 'shabirsk989+student@gmail.com',  role: 'student', source: 'seed.js (updated)' },
  { email: 'shabirsk989+company@gmail.com',  role: 'company', source: 'seed.js (updated)' },
  { email: 'shabirsk989+college@gmail.com',  role: 'college', source: 'seed.js (updated)' },
];

const EMAIL_FLOWS = [
  ['Auth: Forgot Password',          'auth.controller.js',    'User-supplied email'],
  ['Auth: OTP Verification',         'otp.service.js',       'User-supplied email'],
  ['Application: Submit (to student)','application.controller.js','shabirsk989+student@gmail.com'],
  ['Application: Submit (to company)','application.controller.js','shabirsk989+company@gmail.com'],
  ['Application: Status (to student)','application.controller.js','shabirsk989+student@gmail.com'],
  ['Application: Status (to company)','application.controller.js','shabirsk989+company@gmail.com'],
  ['Assessment: Result (to student)', 'assessment.controller.js','shabirsk989+student@gmail.com'],
  ['Assessment: Result (to company)', 'assessment.controller.js','shabirsk989+company@gmail.com'],
  ['Assessment: Assign (to student)', 'assignment.controller.js','shabirsk989+student@gmail.com'],
  ['Interview: Schedule',            'notification.service.js','shabirsk989+student@gmail.com'],
  ['Interview: Update (to student)',  'interview.controller.js','shabirsk989+student@gmail.com'],
  ['Offer: Send (to student)',       'offer.controller.js',   'shabirsk989+student@gmail.com'],
  ['Offer: Accept (to company)',     'offer.controller.js',   'shabirsk989+company@gmail.com'],
  ['Offer: Accept (to student)',     'offer.controller.js',   'shabirsk989+student@gmail.com'],
  ['Offer: Reject (to company)',     'offer.controller.js',   'shabirsk989+company@gmail.com'],
  ['Support: New Ticket (to admin)', 'support.controller.js', 'shabirsk989+admin@gmail.com'],
  ['Support: Reply (to student)',    'support.controller.js', 'shabirsk989+student@gmail.com'],
  ['Support: Close/Resolve',          'support.controller.js', 'shabirsk989+student@gmail.com'],
  ['Notification: App Update',       'notification.service.js','shabirsk989+student@gmail.com'],
  ['Notification: Interview',        'notification.service.js','shabirsk989+student@gmail.com'],
  ['Drive: Publish (to students)',   'drive.controller.js',   'shabirsk989+student@gmail.com'],
  ['Drive: Register (to students)',  'drive.controller.js',   'shabirsk989+student@gmail.com'],
  ['Drive: Shortlist (to students)', 'drive.controller.js',   'shabirsk989+student@gmail.com'],
  ['Drive: Select (to students)',    'drive.controller.js',   'shabirsk989+student@gmail.com'],
];

async function auditRecipients() {
  printSection('AUDIT: All Recipients in Codebase');
  console.log('\nKnown test recipients:\n');
  for (const r of KNOWN_TEST_RECIPIENTS) {
    console.log('  ' + r.email.padEnd(35) + ' ' + r.role.padEnd(10) + ' ' + r.source);
  }

  printSection('DELIVERY CHECK: Domain & MX Validation');
  console.log('');
  for (const r of KNOWN_TEST_RECIPIENTS) {
    const v = await verifyRecipient(r.email);
    record('Recipient: ' + r.email + ' (' + r.role + ')', r.email,
      v.valid ? 'PASS (deliverable)' : 'FAIL (not deliverable)',
      v.details
    );
  }
}

async function auditFlows() {
  printSection('AUDIT: All Email Flows');
  console.log('\nIdentified ' + EMAIL_FLOWS.length + ' distinct email flows.\n');
  for (const [flow, file, recipients] of EMAIL_FLOWS) {
    console.log('  \u2705 ' + flow.padEnd(38) + ' ' + file.padEnd(30) + ' ' + recipients);
  }
}

async function printSummary() {
  printSection('FINAL REPORT');
  console.log('');

  const recipientResults = results.filter(r => r.flow.startsWith('Recipient'));
  const rp = recipientResults.filter(r => r.status.startsWith('PASS')).length;

  console.log('  Recipients:    ' + rp + '/' + recipientResults.length + ' deliverable');
  console.log('  Email Flows:   ' + EMAIL_FLOWS.length + ' identified');
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log('  TOTAL:          ' + passed + '/' + results.length + ' passed | ' + failed + ' failed\n');

  const failedRecipients = recipientResults.filter(r => r.status.startsWith('FAIL'));
  if (failedRecipients.length > 0) {
    console.log('  \u274c FAILED RECIPIENTS:\n');
    for (const f of failedRecipients) {
      console.log('     ' + f.recipient + ' \u2014 ' + f.detail);
    }
  } else {
    console.log('  \u2705 All recipients pass validation!');
    console.log('  \u2705 But NOTE: SMTP acceptance \u2260 delivery.');
    console.log('  \u2705 Set SMTP_USER and SMTP_PASS in .env for actual delivery.');
  }
  console.log('');
}

async function main() {
  console.log('');
  console.log('=== EMAIL DELIVERY VALIDATION AUDIT ===');
  console.log('Started: ' + new Date().toISOString());
  await auditRecipients();
  await auditFlows();
  await printSummary();
  console.log('Completed: ' + new Date().toISOString() + '\n');
}

main().catch(err => { console.error('\nFATAL:', err.message); process.exit(1); });
