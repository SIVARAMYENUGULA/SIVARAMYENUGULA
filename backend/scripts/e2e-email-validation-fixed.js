const API = 'http://localhost:5000/api';
const results = [];
const dns = require('dns').promises;

async function testDns() {
  console.log('\n  DNS Diagnostics:');
  let dnsOk = false;
  try { await dns.resolveMx('gmail.com'); console.log('    resolveMx(gmail.com): OK'); dnsOk = true; }
  catch (e) { console.log('    resolveMx(gmail.com): FAILED - ' + e.code + ' ' + e.message); }
  try { await dns.resolve4('gmail.com'); console.log('    resolve4(gmail.com): OK'); dnsOk = true; }
  catch (e) { console.log('    resolve4(gmail.com): FAILED - ' + e.code + ' ' + e.message); }
  return dnsOk;
}

function recordResult(workflow, recipient, emailGenerated, smtpAccepted, errorMsg) {
  if (!errorMsg) errorMsg = '';
  results.push({ workflow, recipient: recipient || 'N/A', emailGenerated: emailGenerated ? 'Yes' : 'No', smtpAccepted: smtpAccepted ? 'Yes' : 'No', errorMessage: errorMsg });
  const pass = emailGenerated && smtpAccepted;
  const icon = pass ? 'PASS' : 'FAIL';
  console.log('  [' + icon + '] ' + workflow.padEnd(42) + ' | ' + (recipient || 'N/A').padEnd(30) + (errorMsg ? ' | Error: ' + errorMsg : ''));
}

function printSection(title) {
  console.log('\n' + '='.repeat(90));
  console.log('  ' + title);
  console.log('='.repeat(90));
}

function h(token) { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }; }

async function api(method, path, body, token) {
  const opts = { method: method, headers: h(token || '') };
  if (body) opts.body = JSON.stringify(body);
  try { const res = await fetch(API + path, opts); let json; try { json = await res.json(); } catch(e) { json = { success: false }; } return { status: res.status, ok: res.ok, ...json }; }
  catch(e) { return { success: false, error: { code: 'FETCH_ERROR', message: e.message } }; }
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function login(email, password) {
  const res = await api('POST', '/auth/login', { email: email, password: password });
  return (res.success && res.data && res.data.token) ? res.data : null;
}

async function getDeliveryLog() {
  try { const res = await api('GET', '/debug/delivery-log'); return res.success ? (res.data || []) : []; } catch(e) { return []; }
}

async function getNewDeliveries(beforeLog) {
  const currentLog = await getDeliveryLog();
  const beforeIds = new Set(beforeLog.map(function(e) { return e.deliveryId; }));
  return currentLog.filter(function(e) { return !beforeIds.has(e.deliveryId); });
}

async function testSmtpDirect() {
  printSection('SMTP DIRECT TRANSPORT TEST');
  const nodemailer = require('nodemailer');
  const env = require('../src/config/env');
  if (!env.smtpUser || !env.smtpPass) { console.log('  SKIP: No SMTP credentials'); return false; }
  console.log('  Creating direct SMTP transport: ' + env.smtpUser);
  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: env.smtpUser, pass: env.smtpPass } });
  try { await transport.verify(); console.log('  SMTP Transport: VERIFIED'); }
  catch(e) { console.log('  SMTP Transport: FAILED - ' + e.message); return false; }
  try {
    const info = await transport.sendMail({
      from: env.smtpFrom || '"PlaceMux" <noreply@placemux.com>',
      to: 'shabirsk989+test@gmail.com',
      subject: 'E2E SMTP Direct Test - ' + new Date().toISOString(),
      text: 'Direct SMTP test from E2E validation script.',
    });
    console.log('  Result: messageId=' + info.messageId + ' accepted=' + JSON.stringify(info.accepted) + ' rejected=' + JSON.stringify(info.rejected));
    const accepted = info.accepted && info.accepted.length > 0;
    const rejected = info.rejected && info.rejected.length > 0;
    if (accepted && !rejected) console.log('  DIRECT SMTP: SUCCESS');
    else if (rejected) console.log('  DIRECT SMTP: REJECTED - ' + JSON.stringify(info.rejected));
    return accepted && !rejected;
  } catch(e) { console.log('  DIRECT SMTP: FAILED - ' + e.message); return false; }
}

async function main() {
  console.log('');
  console.log('='.repeat(90));
  console.log('  COMPREHENSIVE E2E EMAIL DELIVERY VALIDATION');
  console.log('  Testing ALL 15 Workflows with Real Nodemailer Responses');
  console.log('='.repeat(90));
  console.log('  Started: ' + new Date().toISOString());

  const dnsOk = await testDns();
  const smtpDirect = await testSmtpDirect();

  printSection('LOGIN ALL USERS');
  const companySession = await login('shabirsk989+company@gmail.com', 'Company@123');
  const studentSession = await login('shabirsk989+student@gmail.com', 'Student@123');
  const collegeSession = await login('shabirsk989+college@gmail.com', 'College@123');
  const adminSession = await login('shabirsk989+admin@gmail.com', 'Admin@123');
  if (!companySession || !studentSession || !collegeSession || !adminSession) { console.log('FATAL: Login failed. Aborting.'); return; }
  const ct = companySession.token, st = studentSession.token, clt = collegeSession.token, at = adminSession.token;
  console.log('  All 4 users logged in successfully');

  const sp = await api('GET', '/auth/profile', null, st);
  const cp = await api('GET', '/auth/profile', null, ct);
  let studentId = null;
  try { studentId = sp.data && sp.data.profile ? sp.data.profile._id : (sp.data && sp.data._id ? sp.data._id : null); } catch(e) {}
  const studentEmail = (sp.data && (sp.data.user || sp.data).email) || 'shabirsk989+student@gmail.com';
  let companyId = null;
  try { companyId = cp.data && cp.data.profile ? cp.data.profile._id : (cp.data && cp.data._id ? cp.data._id : null); } catch(e) {}
  const companyEmail = (cp.data && (cp.data.user || cp.data).email) || 'shabirsk989+company@gmail.com';
  let collegeId = null;
  try { const clp = await api('GET', '/auth/profile', null, clt); collegeId = clp.data && clp.data.profile ? clp.data.profile._id : null; } catch(e) {}
  console.log('  Student: ' + studentEmail + ' (ID: ' + studentId + ')');
  console.log('  Company: ' + companyEmail + ' (ID: ' + companyId + ')');
  console.log('  College ID: ' + collegeId);

  // Create Job
  printSection('SETUP: Create Job');
  let job = await api('POST', '/jobs', { title: 'Senior Software Engineer - E2E Email Test', description: 'E2E email validation test', location: 'Remote', type: 'Full-time', salaryMin: 1200000, salaryMax: 2400000 }, ct);
  let jobId = null;
  if (job.success) { jobId = job.data._id; console.log('  Job created: ' + jobId); }
  else { const jobs = await api('GET', '/jobs', null, ct); if (jobs.success && jobs.data && jobs.data.length > 0) { jobId = jobs.data[0]._id; console.log('  Using existing job: ' + jobId); } else { console.log('FATAL: No job. Aborting.'); return; } }

  // WORKFLOW 1: Application Submitted
  printSection('WORKFLOW 1: Application Submitted');
  const dl1 = await getDeliveryLog();
  const appRes = await api('POST', '/applications', { jobId: jobId, coverLetter: 'E2E email validation test' }, st);
  await sleep(3000);
  const dl1b = await getNewDeliveries(dl1);
  let appId = appRes.data ? appRes.data._id : null;
  console.log('  App ID: ' + appId + ' | Emails: ' + dl1b.length);
  dl1b.forEach(function(e) { console.log('    -> ' + e.subject + ' to ' + e.to + ' [' + e.status + '] passed=' + e.passed); });
  const appStu = dl1b.find(function(e) { return e.to === studentEmail; });
  const appComp = dl1b.find(function(e) { return e.to === companyEmail; });
  recordResult('1. Application Submitted (Student)', studentEmail, !!appStu, appStu && appStu.status === 'SMTP_ACCEPTED', appStu ? (appStu.status !== 'SMTP_ACCEPTED' ? 'Status: ' + appStu.status : '') : 'Email not found');
  recordResult('1. Application Submitted (Company)', companyEmail, !!appComp, appComp && appComp.status === 'SMTP_ACCEPTED', appComp ? (appComp.status !== 'SMTP_ACCEPTED' ? 'Status: ' + appComp.status : '') : 'Email not found');

  // WORKFLOW 2: Application Shortlisted
  printSection('WORKFLOW 2: Application Shortlisted');
  if (appId) {
    const dl2 = await getDeliveryLog();
    await api('PUT', '/applications/' + appId + '/status', { 
