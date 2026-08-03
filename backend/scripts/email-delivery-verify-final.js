/**
 * COMPREHENSIVE EMAIL DELIVERY VERIFICATION
 * Tests ALL workflow email events via real API calls.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

var API = 'http://localhost:5000/api';
var workflowResults = [];

function printSection(title) {
  console.log('\n' + '='.repeat(85));
  console.log('  ' + title);
  console.log('='.repeat(85));
}

function recordResult(workflow, recipient, emailGenerated, smtpAccepted, messageId, smtpResponse, errorMsg) {
  workflowResults.push({
    workflow: workflow,
    recipient: recipient || 'N/A',
    emailGenerated: emailGenerated ? 'Yes' : 'No',
    smtpAccepted: smtpAccepted ? 'Yes' : 'No',
    messageId: messageId || 'N/A',
    smtpResponse: smtpResponse || 'N/A',
    errorMessage: errorMsg || ''
  });
  var pass = emailGenerated && smtpAccepted;
  var icon = pass ? 'PASS' : 'FAIL';
  console.log('  [' + icon + '] ' + workflow.padEnd(42) + ' | ' + (recipient || 'N/A').padEnd(30) + (errorMsg ? ' | Error: ' + errorMsg : ''));
}

function h(token) {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
}

async function api(method, path, body, token) {
  var opts = { method: method, headers: h(token || '') };
  if (body) opts.body = JSON.stringify(body);
  try {
    var res = await fetch(API + path, opts);
    var json;
    try { json = await res.json(); } catch(e) { json = { success: false }; }
    return { status: res.status, ok: res.ok, ...json };
  } catch(e) {
    return { success: false, error: { code: 'FETCH_ERROR', message: e.message } };
  }
}

function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

async function login(email, password) {
  var res = await api('POST', '/auth/login', { email: email, password: password });
  if (res.success && res.data && res.data.token) {
    console.log('  LOGIN OK: ' + email);
    return res.data;
  }
  console.log('  LOGIN FAIL: ' + email);
  return null;
}

async function getDeliveryLog() {
  try {
    var res = await api('GET', '/debug/delivery-log');
    return res.success ? (res.data || []) : [];
  } catch(e) { return []; }
}

async function getNewDeliveries(beforeLog) {
  var currentLog = await getDeliveryLog();
  var beforeIds = new Set(beforeLog.map(function(e) { return e.deliveryId; }));
  return currentLog.filter(function(e) { return !beforeIds.has(e.deliveryId); });
}

function showDeliveries(deliveries) {
  for (var i = 0; i < deliveries.length; i++) {
    var e = deliveries[i];
    console.log('    -> [' + e.status + '] "' + e.subject + '" to ' + e.to +
      ' | accepted=' + JSON.stringify(e.accepted || []) +
      ' | rejected=' + JSON.stringify(e.rejected || []) +
      ' | passed=' + e.passed +
      ' | msgId=' + (e.messageId || 'N/A'));
  }
}

function findDelivery(deliveries, email, subjectFilter) {
  for (var i = 0; i < deliveries.length; i++) {
    var d = deliveries[i];
    if (d.to === email && (!subjectFilter || d.subject.indexOf(subjectFilter) >= 0)) {
      return d;
    }
  }
  return null;
}

async function main() {
  console.log('');
  console.log('============================================================');
  console.log('  COMPREHENSIVE EMAIL DELIVERY VERIFICATION');
  console.log('============================================================');
  console.log('  Started: ' + new Date().toISOString());

  // STEP 1: Verify .env Loading & SMTP Credentials
  printSection('STEP 1: Verify .env Loading & SMTP Credentials');

  var smtpUser = process.env.SMTP_USER || '';
  var smtpPass = process.env.SMTP_PASS || '';
  var smtpFrom = process.env.SMTP_FROM || '';

  console.log('  process.env.SMTP_USER:     ' + (smtpUser ? smtpUser : 'MISSING'));
  console.log('  process.env.SMTP_PASS:     ' + (smtpPass ? 'SET (' + smtpPass.substring(0, 6) + '...)' : 'MISSING'));
  console.log('  process.env.SMTP_FROM:     ' + (smtpFrom ? smtpFrom : 'Not set'));
  console.log('  .env LOADING:              ' + (smtpUser && smtpPass ? 'OK' : 'FAILED'));

  if (!smtpUser || !smtpPass) {
    console.error('\n  FATAL: SMTP credentials not found in .env');
    process.exit(1);
  }

  // STEP 2: Nodemailer Transport Verify
  printSection('STEP 2: Nodemailer Transport Verification');

  var nodemailer = require('nodemailer');
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 10000,
    socketTimeout: 30000
  });

  try {
    var verifyResult = await transporter.verify();
    console.log('  transporter.verify() result:', verifyResult);
    console.log('  SMTP TRANSPORT: VERIFIED');
  } catch (err) {
    console.error('  SMTP TRANSPORT: FAILED - ' + err.message);
    process.exit(1);
  }

  // STEP 3: Send Gmail Test Email
  printSection('STEP 3: Send Gmail Test Email to shabirsk989@gmail.com');

  var testInfo = null;
  try {
    testInfo = await transporter.sendMail({
      from: smtpFrom || smtpUser,
      to: 'shabirsk989@gmail.com',
      subject: 'SMTP Delivery Test - ' + new Date().toISOString(),
      text: 'SMTP delivery test from PlaceMux. Sent at: ' + new Date().toISOString(),
      html: '<div><h1>SMTP Delivery Test</h1><p>Sent at: ' + new Date().toISOString() + '</p></div>'
    });

    console.log('  accepted[]:    ' + JSON.stringify(testInfo.accepted || []));
    console.log('  rejected[]:    ' + JSON.stringify(testInfo.rejected || []));
    console.log('  response:      ' + (testInfo.response || 'N/A'));
    console.log('  messageId:     ' + (testInfo.messageId || 'N/A'));
    console.log('  TEST EMAIL:    SENT SUCCESSFULLY');
  } catch (err) {
    console.error('  TEST EMAIL:    FAILED - ' + err.message);
    process.exit(1);
  }

  // STEP 4: Login & Run Workflows
  printSection('STEP 4: Login All Users');

  var companySession = await login('shabirsk989+company@gmail.com', 'Company@123');
  var studentSession = await login('shabirsk989+student@gmail.com', 'Student@123');
  var collegeSession = await login('shabirsk989+college@gmail.com', 'College@123');
  var adminSession = await login('shabirsk989+admin@gmail.com', 'Admin@123');

  if (!companySession || !studentSession || !collegeSession || !adminSession) {
    console.log('\n  FATAL: Login failed. Aborting.');
    process.exit(1);
  }

  var ct = companySession.token, st = studentSession.token, clt = collegeSession.token, at = adminSession.token;

  var sp = await api('GET', '/auth/profile', null, st);
  var cp = await api('GET', '/auth/profile', null, ct);

  var studentId = null, studentEmail = 'shabirsk989+student@gmail.com';
  var companyId = null, companyEmail = 'shabirsk989+company@gmail.com';
  var adminEmail = 'shabirsk989+admin@gmail.com';

  try { if (sp.data && sp.data.profile) { studentId = sp.data.profile._id; studentEmail = sp.data.user ? sp.data.user.email : studentEmail; } } catch(e) {}
  try { if (cp.data && cp.data.profile) { companyId = cp.data.profile._id; companyEmail = cp.data.user ? cp.data.user.email : companyEmail; } } catch(e) {}

  console.log('  Student ID: ' + studentId + ' (' + studentEmail + ')');
  console.log('  Company ID: ' + companyId + ' (' + companyEmail + ')');

  // SETUP: Create Job
  printSection('SETUP: Create Job');
  var job = await api('POST', '/jobs', { title: 'Email Verify Job', description: 'Test', location: 'Remote', type: 'Full-time', salaryMin: 1200000, salaryMax: 2400000 }, ct);
  var jobId = null;
  if (job.success) { jobId = job.data ? job.data._id : null; console.log('  Job: ' + jobId); }
  if (!jobId) {
    var jobs = await api('GET', '/jobs', null, ct);
    if (jobs.success && jobs.data && jobs.data.length > 0) { jobId = jobs.data[0]._id; console.log('  Using existing job: ' + jobId); }
    else { console.log('  FATAL: No job.'); process.exit(1); }
  }

  // W1: Application Submitted
  printSection('WORKFLOW 1: Application Submitted');
  var dl1 = await getDeliveryLog();
  var appRes = await api('POST', '/applications', { jobId: jobId, coverLetter: 'Test' }, st);
  await sleep(3000);
  var dl1b = await getNew
