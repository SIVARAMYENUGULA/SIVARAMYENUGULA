/**
 * COMPREHENSIVE E2E EMAIL DELIVERY VALIDATION
 * ============================================
 * Tests ALL 14 email workflows by triggering real API actions
 * and capturing Nodemailer delivery log responses.
 *
 * Prerequisites:
 *   - MongoDB running
 *   - Backend running on localhost:5000 (with debug/delivery-log route)
 *   - Seed data loaded
 *
 * Run: node scripts/e2e-email-validation-complete.js
 */

const API = 'http://localhost:5000/api';
const results = [];

function recordResult(workflow, recipient, emailGenerated, smtpAccepted, errorMsg) {
  if (!errorMsg) errorMsg = '';
  results.push({
    workflow,
    recipient: recipient || 'N/A',
    emailGenerated: emailGenerated ? 'Yes' : 'No',
    smtpAccepted: smtpAccepted ? 'Yes' : 'No',
    errorMessage: errorMsg,
  });
  const pass = emailGenerated && smtpAccepted;
  const icon = pass ? 'PASS' : 'FAIL';
  console.log('  [' + icon + '] ' + workflow.padEnd(42) + ' | ' + (recipient || 'N/A').padEnd(32) + (errorMsg ? ' | Error: ' + errorMsg : ''));
}

function printSection(title) {
  console.log('\n' + '='.repeat(85));
  console.log('  ' + title);
  console.log('='.repeat(85));
}

function h(token) {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
}

async function api(method, path, body, token) {
  const opts = { method: method, headers: h(token || '') };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(API + path, opts);
    const json = await res.json();
    return { status: res.status, ok: res.ok, ...json };
  } catch (e) {
    return { success: false, error: { code: 'FETCH_ERROR', message: e.message } };
  }
}

async function login(email, password) {
  const res = await api('POST', '/auth/login', { email: email, password: password });
  if (res.success && res.data && res.data.token) return res.data;
  return null;
}

async function getDeliveryLog() {
  try {
    const res = await api('GET', '/debug/delivery-log');
    return res.success ? (res.data || []) : [];
  } catch (e) {
    return [];
  }
}

async function getNewDeliveries(beforeLog) {
  const currentLog = await getDeliveryLog();
  const beforeIds = new Set(beforeLog.map(function(e) { return e.deliveryId; }));
  return currentLog.filter(function(e) { return !beforeIds.has(e.deliveryId); });
}

async function verifySmtpTransport() {
  printSection('SMTP TRANSPORT VERIFICATION');

  // Check if we can reach the debug endpoint
  const log = await getDeliveryLog();
  console.log('  Delivery log endpoint OK. Log entries so far: ' + log.length);

  // Verify SMTP by logging in as student
  const studentSession = await login('shabirsk989+student@gmail.com', 'Student@123');
  if (!studentSession) {
    console.log('  FAIL: Student login failed - cannot verify SMTP');
    return false;
  }

  // Trigger a forgot password email which tests SMTP
  console.log('  Triggering forgot-password to test SMTP transport...');
  const beforeLog = await getDeliveryLog();

  const fp = await api('POST', '/auth/forgot-password', { email: 'shabirsk989+student@gmail.com' });
  console.log('  Forgot password response: ' + (fp.success ? 'OK' : 'FAIL'));

  // Wait for delivery
  await new Promise(function(r) { setTimeout(r, 3000); });

  const newDeliveries = await getNewDeliveries(beforeLog);
  console.log('  New delivery entries after forgot-password: ' + newDeliveries.length);

  for (var i = 0; i < newDeliveries.length; i++) {
    var e = newDeliveries[i];
    console.log('    -> [' + e.status + '] ' + e.subject + ' to ' + e.to + ' (passed=' + e.passed + ', msgId=' + (e.messageId || 'N/A') + ')');
  }

  var smtpAccepted = false;
  for (var i = 0; i < newDeliveries.length; i++) {
    if (newDeliveries[i].passed === true || newDeliveries[i].status === 'SMTP_ACCEPTED') {
      smtpAccepted = true;
      break;
    }
  }

  if (smtpAccepted) {
    console.log('  SMTP TRANSPORT: VERIFIED - Gmail SMTP accepting messages');
  } else {
    console.log('  SMTP TRANSPORT: NOT VERIFIED - Check .env credentials');
    if (newDeliveries.length > 0) {
      console.log('  Status: ' + newDeliveries[0].status + ' - ' + (newDeliveries[0].smtpResponse || 'no details'));
    }
  }

  return smtpAccepted;
}

async function main() {
  console.log('');
  console.log('='.repeat(85));
  console.log('  COMPREHENSIVE E2E EMAIL DELIVERY VALIDATION');
  console.log('  Testing ALL 14 Workflows with Real Nodemailer Responses');
  console.log('='.repeat(85));
  console.log('  Started: ' + new Date().toISOString());
  console.log('');

  // Step 0: SMTP Transport Verification
  var smtpOk = await verifySmtpTransport();
  if (!smtpOk) {
    console.log('\n  WARNING: SMTP transport not verified. Proceeding anyway...');
  } else {
    console.log('\n  SMTP is operational. Proceeding with workflow tests...');
  }

  // Step 1: Login all users
  printSection('LOGIN ALL USERS');

  var companySession = await login('shabirsk989+company@gmail.com', 'Company@123');
  var studentSession = await login('shabirsk989+student@gmail.com', 'Student@123');
  var collegeSession = await login('shabirsk989+college@gmail.com', 'College@123');
  var adminSession = await login('shabirsk989+admin@gmail.com', 'Admin@123');

  if (!companySession || !studentSession || !collegeSession || !adminSession) {
    console.log('FATAL: One or more user logins failed. Aborting.');
    return;
  }

  var ct = companySession.token;
  var st = studentSession.token;
  var clt = collegeSession.token;
  var at = adminSession.token;
  console.log('  All 4 users logged in successfully');

  // Get profiles
  var sp = await api('GET', '/auth/profile', null, st);
  var cp = await api('GET', '/auth/profile', null, ct);
  var admp = await api('GET', '/auth/profile', null, at);

  var studentId = sp.data && sp.data.profile ? sp.data.profile._id : null;
  var studentEmail = (sp.data && sp.data.user ? sp.data.user.email : null) || 'shabirsk989+student@gmail.com';
  var companyId = cp.data && cp.data.profile ? cp.data.profile._id : null;
  var companyEmail = (cp.data && cp.data.user ? cp.data.user.email : null) || 'shabirsk989+company@gmail.com';
  var adminEmail = (admp.data && admp.data.user ? admp.data.user.email : null) || 'shabirsk989+admin@gmail.com';

  console.log('  Student: ' + studentEmail + ' (ID: ' + studentId + ')');
  console.log('  Company: ' + companyEmail + ' (ID: ' + companyId + ')');
  console.log('  Admin: ' + adminEmail);

  // Step 2: Create Job
  printSection('SETUP: Create Job');

  console.log('  Creating job...');
  var job = await api('POST', '/jobs', {
    title: 'Senior Software Engineer - E2E Test',
    description: 'E2E email validation test position',
    location: 'Remote',
    type: 'Full-time',
    salaryMin: 1200000,
    salaryMax: 2400000,
  }, ct);

  var jobId = null;
  if (job.success) {
    jobId = job.data._id;
    console.log('  Job created: ' + job.data.title + ' (' + jobId + ')');
  } else {
    console.log('  Failed to create job: ' + (job.error ? job.error.message : job.message || 'unknown'));
    // Try listing existing jobs
    var jobs = await api('GET', '/jobs', null, ct);
    if (jobs.success && jobs.data && jobs.data.length > 0) {
      jobId = jobs.data[0]._id;
      console.log('  Using existing job: ' + jobs.data[0].title + ' (' + jobId + ')');
    } else {
      console.log('FATAL: No job available. Aborting.');
      return;
    }
  }

  // WORKFLOW 1: Application Submitted
  printSection('WORKFLOW 1: Application Submitted');

  var dl1 = await getDeliveryLog();
  var appRes = await api('POST', '/applications', { jobId: jobId, coverLetter: 'E2E email validation test' }, st);
  await new Promise(function(r) { setTimeout(r, 3000); });
  var dl1b = await getNewDeliveries(dl1);
  var appId = appRes.data ? appRes.data._id : null;
  console.log('  Application ID: ' + appId + ' | Emails sent: ' + dl1b.length);
  for (var i = 0; i < dl1b.length; i++) {
    console.log('    -> ' + dl1b[i].subject + ' to ' + dl1b[i].to + ' [' + dl1b[i].status + '] passed=' + dl1b[i].passed);
  }

  var appStu = null;
  var appComp = null;
  for (var i = 0; i < dl1b.length; i++) {
    if (dl1b[i].to === studentEmail && dl1b[i].subject.indexOf('Submitted') >= 0) appStu = dl1b[i];
    if (dl1b[i].to === companyEmail && dl1b[i].subject.indexOf('Application') >= 0 && dl1b[i].subject.indexOf('Submitted') < 0) appComp = dl1b[i];
    if (!appComp && dl1b[i].to === companyEmail) appComp = dl1b[i];
  }

  recordResult('1. Application Submitted (to Student)', studentEmail, !!appStu, appStu && appStu.status === 'SMTP_ACCEPTED', appStu ? '' : 'Email not found');
  recordResult('1. Application Submitted (to Company)', companyEmail, !!appComp, appComp && appComp.status === 'SMTP_ACCEPTED', appComp ? '' : 'Email not found');

  // WORKFLOW 2: Application Shortlisted
  printSection('WORKFLOW 2: Application Shortlisted');

  var dl2 = await getDeliveryLog();
  await api('PUT', '/applications/' + appId + '/status', { status: 'Shortlisted' }, ct);
  await new Promise(function(r) { setTimeout(r, 3000); });
  var dl2b = await getNewDeliveries(dl2);
  console.log('  Emails sent: ' + dl2b.length);
  for (var i = 0; i < dl2b.length; i++) {
    console.log('    -> ' + dl2b[i].subject + ' to ' + dl2b[i].to + ' [' + dl2b[i].status + '] passed=' + dl2b[i].passed);
  }

  var shortStu = null;
  var shortComp = null;
  for (var i = 0; i < dl2b.length; i++) {
    if (dl2b[i].to === studentEmail && dl2b[i].subject.indexOf('Shortlisted') >= 0) shortStu = dl2b[i];
    if (dl2b[i].to === companyEmail && dl2b[i].subject.indexOf('Shortlisted') >= 0) shortComp = dl2b[i];
  }

  recordResult('2. Application Shortlisted (to Student)', studentEmail, !!shortStu, shortStu && shortStu.status === 'SMTP_ACCEPTED', shortStu ? '' : 'Email not found');
  recordResult('2. Application Shortlisted (to Company)', companyEmail, !!shortComp, shortComp && shortComp.status === 'SMTP_ACCEPTED', shortComp ? '' : 'Email not found');

  // WORKFLOW 3: Assessment Assigned
  printSection('WORKFLOW 3: Assessment Assigned');

  var asRes = await api('POST', '/assessments', { title: 'E2E Tech Assessment', type: 'Technical', duration: 30, passingScore: 60 }, ct);
  var asId = asRes.data ? asRes.data._id : null;

  if (asId) {
    await api('POST', '/assessments/' + asId + '/questions', {
      questions: [
        { questionText: 'Capital of France?', options: ['London', 'Paris', 'Berlin', 'Madrid'], correctIndex: 1, points: 10 },
        { questionText: '2+2?', options: ['3', '4', '5', '6'], correctIndex: 1, points: 10 }
      ]
    }, ct);

    var dl3 = await getDeliveryLog();
    var assignRes = await api('POST', '/assignments', { assessmentId: asId, studentIds: [studentId] }, ct);
    await new Promise(function(r) { setTimeout(r, 3000); });
    var dl3b = await getNewDeliveries(dl3);
    console.log('  Assign response: ' + (assignRes.success ? 'OK' : 'FAIL'));
    console.log('  Emails sent: ' + dl3b.length);
    for (var i = 0; i < dl3b.length; i++) {
      console.log('    -> ' + dl3b[i].subject + ' to ' + dl3b[i].to + ' [' + dl3b[i].status + '] passed=' + dl3b[i].passed);
    }
    var assignEmail = null;
    for (var i = 0; i < dl3b.length; i++) {
      if (dl3b[i].to === studentEmail && dl3b[i].subject.indexOf('Assessment') >= 0) assignEmail = dl3b[i];
    }
    recordResult('3. Assessment Assigned', studentEmail, !!assignEmail, assignEmail && assignEmail.status === 'SMTP_ACCEPTED', assignEmail ? '' : 'Email not found');

    // WORKFLOW 4: Assessment Result
    printSection('WORKFLOW 4: Assessment Result');

    await api('POST', '/assessments/' + asId + '/start', null, st);
    var dl4 = await getDeliveryLog();
    var submitRes = await api('POST', '/assessments/' + asId + '/submit', {
      answers: [{ questionIndex: 0, selectedIndex: 1 }, { questionIndex: 1, selectedIndex: 1 }]
    }, st);
    await new Promise(function(r) { setTimeout(r, 3000); });
    var dl4b = await getNewDeliveries(dl4);
    console.log('  Submit response: ' + (submitRes.success ? 'OK' : 'FAIL') + ' Score: ' + (submitRes.data ? submitRes.data.score : '?'));
    console.log('  Emails sent: ' + dl4b.length);
    for (var i = 0; i < dl4b.length; i++) {
      console.log('    -> ' + dl4b[i].subject + ' to ' + dl4b[i].to + ' [' + dl4b[i].status + '] passed=' + dl4b[i].passed);
    }
    var resultStu = null;
    var resultComp = null;
    for (var i = 0; i < dl4b.length; i++) {
      if (dl4b[i].to === studentEmail && dl4b[i].subject.indexOf('Assessment Result') >= 0) resultStu = dl4b[i];
      if (dl4b[i].to === companyEmail && dl4b[i].subject.indexOf('Assessment Completed') >= 0) resultComp = dl4b[i];
    }
    recordResult('4. Assessment Result (to Student)', studentEmail, !!resultStu, resultStu && resultStu.status === 'SMTP_ACCEPTED', resultStu ? '' : 'Email not found');
    recordResult('4. Assessment Result (to Company)', companyEmail, !!resultComp, resultComp && resultComp.status === 'SMTP_ACCEPTED', resultComp ? '' : 'Email not found');
  } else {
    console.log('  Failed to create assessment');
    recordResult('3. Assessment Assigned', studentEmail, false, false, 'Failed to create assessment');
    recordResult('4. Assessment Result', studentEmail, false, false, 'Skipped');
    recordResult('4. Assessment Result (Company)', companyEmail, false, false, 'Skipped');
  }

  // WORKFLOW 5: Interview Scheduled
  printSection('WORKFLOW 5: Interview Scheduled');

  var dl5 = await getDeliveryLog();
  var ivRes = await api('POST', '/interviews', {
    companyId: companyId,
    jobId: jobId,
    applicationId: appId,
    studentId: studentId,
    candidateName: 'Arjun Mehta',
    candidateEmail: studentEmail,
    jobTitle: 'Senior Software Engineer - E2E Test',
    date: '2026-06-25T10:00:00Z',
    time: '10:00 AM',
    meetingLink: 'https://meet.google.com/e2e-test',
    type: 'Technical'
  }, ct);
  await new Promise(function(r) { setTimeout(r, 3000); });
  var dl5b = await getNewDeliveries(dl5);
  var ivId = ivRes.data ? ivRes.data._id : null;
  console.log('  Interview ID: ' + ivId + ' | Emails sent: ' + dl5b.length);
  for (var i = 0; i < dl5b.length; i++) {
    console.log('    -> ' + dl5b[i].subject + ' to ' + dl5b[i].to + ' [' + dl5b[i].status + '] passed=' + dl5b[i].passed);
  }
  var ivEmail = null;
  for (var i = 0; i < dl5b.length; i++) {
    if (dl5b[i].to === studentEmail && dl5b[i].subject.indexOf('Interview Scheduled') >= 0) ivEmail = dl5b[i];
  }
  recordResult('5. Interview Scheduled', studentEmail, !!ivEmail, ivEmail && ivEmail.status === 'SMTP_ACCEPTED', ivEmail ? '' : 'Email not found');

  // WORKFLOW 6: Interview Feedback
  printSection('WORKFLOW 6: Interview Feedback');

  var dl6 = await getDeliveryLog();
  var fbRes = await api('PUT', '/interviews/' + ivId, { status: 'Completed', feedback: 'Excellent performance. Strong technical skills.' }, ct);
  await new Promise(function(r) { setTimeout(r, 3000); });
  var dl6b = await getNewDeliveries(dl6);
  console.log('  Feedback response: ' + (fbRes.success ? 'OK' : 'FAIL'));
  console.log('  Emails sent: ' + dl6b.length);
  for (var i = 0; i < dl6b.length; i++) {
    console.log('    -> ' + dl6b[i].subject + ' to ' + dl6b[i].to + ' [' + dl6b[i].status + '] passed=' + dl6b[i].passed);
  }
  var fbEmail = null;
  for (var i = 0; i < dl6b.length; i++) {
    if (dl6b[i].to === studentEmail) fbEmail = dl6b[i];
  }
  recordResult('6. Interview Feedback', studentEmail, !!fbEmail, fbEmail && fbEmail.status === 'SMTP_ACCEPTED', fbEmail ? '' : 'Email not found');

  // WORKFLOW 7: Offer Sent
  printSection('WORKFLOW 7: Offer Sent');

  var ofRes = await api('POST', '/offers', {
    companyId: companyId,
    jobId: jobId,
    applicationId: appId,
    studentId: studentId,
    candidateName: 'Arjun Mehta',
    jobTitle: 'Senior Software Engineer - E2E Test',
    package: 1800000,
    joiningDate: '2026-07-01'
  }, ct);

  var ofId = ofRes.data ? ofRes.data._id : null;
  if (ofId) {
    var dl7 = await getDeliveryLog();
    var sendOfRes = await api('POST', '/offers/' + ofId + '/send', { expiryDate: '2026-07-15' }, ct);
    await new Promise(function(r) { setTimeout(r, 3000); });
    var dl7b = await getNewDeliveries(dl7);
    console.log('  Send offer response: ' + (sendOfRes.success ? 'OK' : 'FAIL'));
    console.log('  Emails sent: ' + dl7b.length);
    for (var i = 0; i < dl7b.length; i++) {
      console.log('    -> ' + dl7b[i].subject + ' to ' + dl7b[i].to + ' [' + dl7b[i].status + '] passed=' + dl7b[i].passed);
    }
    var offerEmail = null;
    for (var i = 0; i < dl7b.length; i++) {
      if (dl7b[i].to === studentEmail && dl7b[i].subject.indexOf('Offer') >= 0) offerEmail = dl7b[i];
    }
    recordResult('7. Offer Sent', studentEmail, !!offerEmail, offerEmail && offerEmail.status === 'SMTP_ACCEPTED', offerEmail ? '' : 'Email not found');

    // WORKFLOW 8: Offer Accepted
    printSection('WORKFLOW 8: Offer Accepted');

    var dl8 = await getDeliveryLog();
    var acceptRes = await api('POST', '/offers/' + ofId + '/accept', null, st);
    await new Promise(function(r) { setTimeout(r, 3000); });
    var dl8b = await getNewDeliveries(dl8);
    console.log('  Accept response: ' + (acceptRes.success ? 'OK' : 'FAIL'));
    console.log('  Emails sent: ' + dl8b.length);
    for (var i = 0; i < dl8b.length; i++) {
      console.log('    -> ' + dl8b[i].subject + ' to ' + dl8b[i].to + ' [' + dl8b[i].status + '] passed=' + dl8b[i].passed);
    }
    var acceptComp = null;
    var acceptStu = null;
    for (var i = 0; i < dl8b.length; i++) {
      if (dl8b[i].to === companyEmail && dl8b[i].subject.indexOf('Offer Accepted') >= 0) acceptComp = dl8b[i];
      if (dl8b[i].to === studentEmail && dl8b[i].subject.indexOf('Placement') >= 0) acceptStu = dl8b[i];
    }
    recordResult('8. Offer Accepted (to Company)', companyEmail, !!acceptComp, acceptComp && acceptComp.status === 'SMTP_ACCEPTED', acceptComp ? '' : 'Email not found');
    recordResult('8. Offer Accepted (Student Confirm)', studentEmail, !!acceptStu, acceptStu && acceptStu.status === 'SMTP_ACCEPTED', acceptStu ? '' : 'Email not found');

    // WORKFLOW 9: Offer Rejected
    // Create new job + offer for rejection test
    printSection('WORKFLOW 9: Offer Rejected');

    var job2 = await api('POST', '/jobs', { title: 'Backend Engineer - Rejection', description: 'For rejection test', location: 'Remote', type: 'Full-time', salaryMin: 1000000, salaryMax: 1800000 }, ct);
    var job2Id = job2.data ? job2.data._id : null;
    if (job2Id) {
      var app2 = await api('POST', '/applications', { jobId: job2Id, coverLetter: 'Rejection test' }, st);
      var app2Id = app2.data ? app2.data._id : null;
      var of2 = await api('POST', '/offers', { companyId: companyId, jobId: job2Id, applicationId: app2Id, studentId: studentId, candidateName: 'Arjun Mehta', jobTitle: 'Backend Engineer - Rejection', package: 1500000, joiningDate: '2026-08-01' }, ct);
      var of2Id = of2.data ? of2.data._id : null;
      if (of2Id) {
        await api('POST', '/offers/' + of2Id + '/send', { expiryDate: '2026-08-15' }, ct);
        await new Promise(function(r) { setTimeout(r, 2000); });
        var dl9 = await getDeliveryLog();
        var rejectRes = await api('POST', '/offers/' + of2Id + '/reject', null, st);
        await new Promise(function(r) { setTimeout(r, 3000); });
        var dl9b = await getNewDeliveries(dl9);
        console.log('  Reject response: ' + (rejectRes.success ? 'OK' : 'FAIL'));
        console.log('  Emails sent: ' + dl9b.length);
        for (var i = 0; i < dl9b.length; i++) {
          console.log('    -> ' + dl9b[i].subject + ' to ' + dl9b[i].to + ' [' + dl9b[i].status + '] passed=' + dl9b[i].passed);
        }
        var rejectComp = null;
        for (var i = 0; i < dl9b.length; i++) {
          if (dl9b[i].to === companyEmail && dl9b[i].subject.indexOf('Offer Rejected') >= 0) rejectComp = dl9b[i];
        }
        recordResult('9. Offer Rejected (to Company)', companyEmail, !!rejectComp, rejectComp && rejectComp.status === 'SMTP_ACCEPTED', rejectComp ? '' : 'Email not found');
      } else {
        recordResult('9. Offer Rejected', companyEmail, false, false, 'Failed to create 2nd offer');
      }
    } else {
      recordResult('9. Offer Rejected', companyEmail, false, false, 'Failed to create 2nd job');
    }
  } else {
    console.log('  Failed to create offer');
    recordResult('7. Offer Sent', studentEmail, false, false, 'Failed to create offer');
    recordResult('8. Offer Accepted', companyEmail, false, false, 'Skipped');
    recordResult('8. Offer Accepted (Student)', studentEmail, false, false, 'Skipped');
    recordResult('9. Offer Rejected', companyEmail, false, false, 'Skipped');
  }

  // WORKFLOW 10: Drive Published
  printSection('WORKFLOW 10: Drive Published');

  var drRes = await api('POST', '/drives', {
    name: 'E2E Test Campus Drive',
    description: 'Campus drive for E2E email validation',
    companyId: companyId,
    jobId: jobId,
    eligibility: { branches: ['B.Tech Computer Science'], onlyUnplaced: false },
    stages: [{ name: 'Assessment', status: 'active', order: 1 }],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString()
  }, clt);

  var driveId = drRes.data ? drRes.data._id : null;
  if (driveId) {
    var dl10 = await getDeliveryLog();
    var pubRes = await api('POST', '/drives/' + driveId + '/publish', null, clt);
    await new Promise(function(r) { setTimeout(r, 3000); });
    var dl10b = await getNewDeliveries(dl10);
    console.log('  Publish response: ' + (pubRes.success ? 'OK' : 'FAIL'));
    console.log('  Emails sent: ' + dl10b.length);
    for (var i = 0; i < dl10b.length; i++) {
      console.log('    -> ' + dl10b[i].subject + ' to ' + dl10b[i].to + ' [' + dl10b[i].status + '] passed=' + dl10b[i].passed);
    }
    var drivePubEmail = null;
    for (var i = 0; i < dl10b.length; i++) {
      if (dl10b[i].to === studentEmail && dl10b[i].subject.indexOf('Drive Published') >= 0) drivePubEmail = dl10b[i];
    }
    recordResult('10. Drive Published', studentEmail, !!drivePubEmail, drivePubEmail && drivePubEmail.status === 'SMTP_ACCEPTED', drivePubEmail ? '' : 'Email not found');

    // WORKFLOW 11: Drive Registration
    printSection('WORKFLOW 11: Drive Registration');

    var dl11 = await getDeliveryLog();
    var regRes = await api('POST', '/drives/' + driveId + '/register-students', { studentIds: [studentId] }, clt);
    await new Promise(function(r) { setTimeout(r, 3000); });
    var dl11b = await getNewDeliveries(dl11);
    console.log('  Register response: ' + (regRes.success ? 'OK' : 'FAIL'));
    console.log('  Emails sent: ' + dl11b.length);
    for (var i = 0; i < dl11b.length; i++) {
      console.log('    -> ' + dl11b[i].subject + ' to ' + dl11b[i].to + ' [' + dl11b[i].status + '] passed=' + dl11b[i].passed);
    }
    var driveRegEmail = null;
    for (var i = 0; i < dl11b.length; i++) {
      if (dl11b[i].to === studentEmail && dl11b[i].subject.indexOf('Drive Registration') >= 0) driveRegEmail = dl11b[i];
    }
    recordResult('11. Drive Registration', studentEmail, !!driveRegEmail, driveRegEmail && driveRegEmail.status === 'SMTP_ACCEPTED', driveRegEmail ? '' : 'Email not found');

    // WORKFLOW 12: Drive Shortlisted
    printSection('WORKFLOW 12: Drive Shortlisted');

    var dl12 = await getDeliveryLog();
    var shortDrRes = await api('POST', '/drives/' + driveId + '/shortlist', { studentIds: [studentId] }, ct);
    await new Promise(function(r) { setTimeout(r, 3000); });
    var dl12b = await getNewDeliveries(dl12);
    console.log('  Shortlist response: ' + (shortDrRes.success ? 'OK' : 'FAIL'));
    console.log('  Emails sent: ' + dl12b.length);
    for (var i = 0; i < dl12b.length; i++) {
      console.log('    -> ' + dl12b[i].subject + ' to ' + dl12b[i].to + ' [' + dl12b[i].status + '] passed=' + dl12b[i].passed);
    }
    var driveShortEmail = null;
    for (var i = 0; i < dl12b.length; i++) {
      if (dl12b[i].to === studentEmail && dl12b[i].subject.indexOf('Shortlisted') >= 0) driveShortEmail = dl12b[i];
    }
    recordResult('12. Drive Shortlisted', studentEmail, !!driveShortEmail, driveShortEmail && driveShortEmail.status === 'SMTP_ACCEPTED', driveShortEmail ? '' : 'Email not found');
  } else {
    console.log('  Failed to create drive');
    recordResult('10. Drive Published', studentEmail, false, false, 'Failed to create drive');
    recordResult('11. Drive Registration', studentEmail, false, false, 'Skipped');
    recordResult('12. Drive Shortlisted', studentEmail, false, false, 'Skipped');
  }

  // WORKFLOW 13: Support Ticket Created
  printSection('WORKFLOW 13: Support Ticket Created');

  var dl13 = await getDeliveryLog();
  var tickRes = await api('POST', '/support', { subject: 'E2E Email Validation Test', message: 'Testing support ticket email notification', category: 'Technical', priority: 'High' }, st);
  await new Promise(function(r) { setTimeout(r, 3000); });
  var dl13b = await getNewDeliveries(dl13);
  var ticketId = tickRes.data ? tickRes.data._id : null;
  console.log('  Ticket ID: ' + ticketId + ' | Emails sent: ' + dl13b.length);
  for (var i = 0; i < dl13b.length; i++) {
    console.log('    -> ' + dl13b[i].subject + ' to ' + dl13b[i].to + ' [' + dl13b[i].status + '] passed=' + dl13b[i].passed);
  }
  var ticketCreateEmail = null;
  for (var i = 0; i < dl13b.length; i++) {
    if (dl13b[i].subject.indexOf('Support Ticket') >= 0) ticketCreateEmail = dl13b[i];
  }
  recordResult('13. Support Ticket Created', adminEmail, !!ticketCreateEmail, ticketCreateEmail && ticketCreateEmail.status === 'SMTP_ACCEPTED', ticketCreateEmail ? '' : 'Email not found');

  // WORKFLOW 14: Support Ticket Reply
  printSection('WORKFLOW 14: Support Ticket Reply');

  if (ticketId) {
    var dl14 = await getDeliveryLog();
    var replyRes = await api('PUT', '/support/' + ticketId + '/reply', { message: 'We have resolved your issue. Please try again.' }, at);
    await new Promise(function(r) { setTimeout(r, 3000); });
    var dl14b = await getNewDeliveries(dl14);
    console.log('  Reply response: ' + (replyRes.success ? 'OK' : 'FAIL'));
    console.log('  Emails sent: ' + dl14b.length);
    for (var i = 0; i < dl14b.length; i++) {
      console.log('    -> ' + dl14b[i].subject + ' to ' + dl14b[i].to + ' [' + dl14b[i].status + '] passed=' + dl14b[i].passed);
    }
    var ticketReplyEmail = null;
    for (var i = 0; i < dl14b.length; i++) {
      if (dl14b[i].to === studentEmail && dl14b[i].subject.indexOf('Support Ticket Reply') >= 0) ticketReplyEmail = dl14b[i];
    }
    recordResult('14. Support Ticket Reply', studentEmail, !!ticketReplyEmail, ticketReplyEmail && ticketReplyEmail.status === 'SMTP_ACCEPTED', ticketReplyEmail ? '' : 'Email not found');

    // WORKFLOW 15: Support Ticket Closed
    printSection('WORKFLOW 15: Support Ticket Closed');

    var dl15 = await getDeliveryLog();
    var closeRes = await api('PUT', '/support/' + ticketId + '/status', { status: 'Closed' }, at);
    await new Promise(function(r) { setTimeout(r, 3000); });
    var dl15b = await getNewDeliveries(dl15);
    console.log('  Close response: ' + (closeRes.success ? 'OK' : 'FAIL'));
    console.log('  Emails sent: ' + dl15b.length);
    for (var i = 0; i < dl15b.length; i++) {
      console.log('    -> ' + dl15b[i].subject + ' to ' + dl15b[i].to + ' [' + dl15b[i].status + '] passed=' + dl15b[i].passed);
    }
    var ticketCloseEmail = null;
    for (var i = 0; i < dl15b.length; i++) {
      if (dl15b[i].to === studentEmail && (dl15b[i].subject.indexOf('Closed') >= 0 || dl15b[i].subject.indexOf('Support Ticket') >= 0)) ticketCloseEmail = dl15b[i];
    }
    recordResult('15. Support Ticket Closed', studentEmail, !!ticketCloseEmail, ticketCloseEmail && ticketCloseEmail.status === 'SMTP_ACCEPTED', ticketCloseEmail ? '' : 'Email not found');
  } else {
    recordResult('14. Support Ticket Reply', studentEmail, false, false, 'No ticket ID');
    recordResult('15. Support Ticket Closed', studentEmail, false, false, 'No ticket ID');
  }

  // FINAL RESULTS TABLE
  printSection('FINAL RESULTS TABLE');

  console.log('');
  console.log('  ' + '-'.repeat(120));
  console.log('  STATUS  | WORKFLOW' + ' '.repeat(34) + '| RECIPIENT' + ' '.repeat(24) + '| EMAIL? | SMTP? | ERROR');
  console.log('  ' + '-'.repeat(120));

  var passCount = 0;
  var failCount = 0;
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    var pass = r.emailGenerated === 'Yes' && r.smtpAccepted === 'Yes';
    if (pass) passCount++; else failCount++;
    var status = pass ? 'PASS' : 'FAIL';
    console.log('  ' + status.padEnd(7) + '| ' + r.workflow.padEnd(37) + '| ' + r.recipient.padEnd(30) + '| ' + r.emailGenerated.padEnd(7) + '| ' + r.smtpAccepted.padEnd(6) + '| ' + r.errorMessage);
  }

  console.log('  ' + '-'.repeat(120));
  console.log('');
  console.log('  SUMMARY: ' + passCount + ' PASSED / ' + failCount + ' FAILED / ' + results.length + ' TOTAL');
  console.log('');
  console.log('  OVERALL: ' + (failCount === 0 ? 'ALL WORKFLOWS PASSED' : 'SOME WORKFLOWS FAILED'));
  console.log('');
  console.log('Completed: ' + new Date().toISOString());
}

main().catch(function(e) {
  console.error('\nFATAL ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
