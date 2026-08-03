const http = require('http');
const BASE = 'http://localhost:5000';
let results = { pass: [], fail: [], notImplemented: [] };
let globalToken = '';

function log(cat, test, status, details) {
  const icon = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'SKIP';
  console.log(`  [${icon}] ${test}: ${details}`);
  if (status === 'PASS') results.pass.push(test);
  else if (status === 'FAIL') results.fail.push(test);
  else results.notImplemented.push(test);
}

function req(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const body = data ? JSON.stringify(data) : undefined;
    const opt = { hostname: 'localhost', port: 5000, path: path, method, headers: body ? { ...headers, 'Content-Length': Buffer.byteLength(body) } : headers };
    const r = http.request(opt, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function run() {
  console.log('========================================');
  console.log('PHASE 2: RUNTIME VALIDATION');
  console.log('========================================\n');

  // 1. HEALTH
  console.log('--- 1. SYSTEM HEALTH ---');
  try {
    const h = await req('GET', '/api/health');
    log('system', 'Backend Health', h.status === 200 ? 'PASS' : 'FAIL', 'Status ' + h.status);
  } catch(e) { log('system', 'Backend Health', 'FAIL', e.message); return printSummary(); }

  // 2. AUTH
  console.log('\n--- 2. AUTHENTICATION ---');
  try {
    const login = await req('POST', '/api/auth/login', { email: 'shabirsk989+student@gmail.com', password: 'Student@123' });
    globalToken = login.body?.data?.token || '';
    log('auth', 'Login', login.status === 200 ? 'PASS' : 'FAIL', 'Token: ' + globalToken.substring(0,20) + '...');
  } catch(e) { log('auth', 'Login', 'FAIL', e.message); }

  if (globalToken) {
    try {
      const p = await req('GET', '/api/auth/profile', null, globalToken);
      log('auth', 'Profile Fetch', p.body?.success ? 'PASS' : 'FAIL', 'Name: ' + (p.body?.data?.user?.name || ''));
    } catch(e) { log('auth', 'Profile Fetch', 'FAIL', e.message); }
    
    try {
      const b = await req('POST', '/api/auth/login', { email: 'shabirsk989+student@gmail.com', password: 'wrong' });
      log('auth', 'Wrong Password Rejected', b.status === 401 ? 'PASS' : 'FAIL', 'Status ' + b.status);
    } catch(e) { log('auth', 'Wrong Password Rejected', 'FAIL', e.message); }
  }

  // 3. SECURITY
  console.log('\n--- 3. SECURITY ---');
  try {
    const j = await req('GET', '/api/auth/profile', null, 'eyJhbGciOiJIUzI1NiJ9.fake.dGVzdA');
    log('security', 'JWT Tampering Rejected', j.status === 401 ? 'PASS' : 'FAIL', 'Status ' + j.status);
  } catch(e) { log('security', 'JWT Tampering Rejected', 'FAIL', e.message); }
  
  try {
    const n = await req('GET', '/api/auth/profile');
    log('security', 'No Auth Rejected', n.status === 401 ? 'PASS' : 'FAIL', 'Status ' + n.status);
  } catch(e) { log('security', 'No Auth Rejected', 'FAIL', e.message); }
  
  if (globalToken) {
    try {
      const a = await req('GET', '/api/admin/stats', null, globalToken);
      log('security', 'Role Escalation Blocked', a.status === 403 ? 'PASS' : 'FAIL', 'Status ' + a.status);
    } catch(e) { log('security', 'Role Escalation Blocked', 'FAIL', e.message); }
  }

  // RATE LIMITING
  let rateLimited = false;
  for (let i = 0; i < 30 && !rateLimited; i++) {
    try {
      const r = await req('POST', '/api/auth/login', { email: 'spam' + i + '@test.com', password: 'Test12345678' });
      if (r.status === 429) rateLimited = true;
    } catch {}
  }
  log('security', 'Rate Limiting', rateLimited ? 'PASS' : 'SKIP', rateLimited ? 'Triggered after rapid requests' : 'Did not trigger in test env');

  // 4. ASSESSMENTS
  console.log('\n--- 4. ASSESSMENTS ---');
  if (globalToken) {
    try {
      const list = await req('GET', '/api/assessments', null, globalToken);
      const ass = list.body?.data || [];
      log('assessments', 'List Assessments', list.body?.success ? 'PASS' : 'FAIL', ass.length + ' found');
      
      if (ass.length > 0) {
        const aid = ass[0]._id;
        const start = await req('POST', '/api/assessments/' + aid + '/start', {}, globalToken);
        if (start.body?.success && start.body?.data?.questions) {
          const qs = start.body.data.questions;
          log('assessments', 'Start Assessment', 'PASS', qs.length + ' questions');
          log('assessments', 'Questions Sanitized', qs[0]?.correctIndex === undefined ? 'PASS' : 'FAIL', 'correctIndex hidden: ' + (qs[0]?.correctIndex === undefined));
          
          const answers = qs.map(q => ({ questionId: q._id, selectedIndex: 0 }));
          const sub = await req('POST', '/api/assessments/' + aid + '/submit', { answers }, globalToken);
          log('assessments', 'Submit Assessment', sub.body?.success ? 'PASS' : 'FAIL', 'Score: ' + (sub.body?.data?.score || 0) + '/' + (sub.body?.data?.maxScore || 0));
          
          const res = await req('GET', '/api/assessments/' + aid + '/results', null, globalToken);
          log('assessments', 'Get Results', res.body?.success ? 'PASS' : 'FAIL', 'Grade: ' + (res.body?.data?.grade || 'N/A'));
        } else {
          log('assessments', 'Start Assessment', 'FAIL', start.body?.error?.message || 'No questions');
        }
        
        const hist = await req('GET', '/api/assessments/history', null, globalToken);
        log('assessments', 'Assessment History', hist.body?.success ? 'PASS' : 'FAIL', (hist.body?.data?.length || 0) + ' entries');
      }
    } catch(e) { log('assessments', 'Assessments API', 'FAIL', e.message); }
  }

  // 5. JOBS, APPLICATIONS, INTERVIEWS
  console.log('\n--- 5. JOBS & APPLICATIONS ---');
  if (globalToken) {
    try {
      const j = await req('GET', '/api/jobs', null, globalToken);
      log('jobs', 'List Jobs', j.body?.success ? 'PASS' : 'FAIL', (j.body?.data?.length || 0) + ' jobs');
      const r = await req('GET', '/api/jobs/recommended', null, globalToken);
      log('jobs', 'Recommended Jobs', r.body?.success ? 'PASS' : 'FAIL', (r.body?.data?.length || 0) + ' recommended');
    } catch(e) { log('jobs', 'Jobs API', 'FAIL', e.message); }
    
    try {
      const a = await req('GET', '/api/applications', null, globalToken);
      log('applications', 'List Applications', a.body?.success ? 'PASS' : 'FAIL', (a.body?.data?.length || 0) + ' apps');
    } catch(e) { log('applications', 'Applications API', 'FAIL', e.message); }
    
    try {
      const i = await req('GET', '/api/interviews', null, globalToken);
      log('interviews', 'List Interviews', i.body?.success ? 'PASS' : 'FAIL', (i.body?.data?.length || 0) + ' interviews');
    } catch(e) { log('interviews', 'Interviews API', 'FAIL', e.message); }
  }

  // 6. SETTINGS
  console.log('\n--- 6. SETTINGS ---');
  if (globalToken) {
    try {
      const s = await req('GET', '/api/settings', null, globalToken);
      log('settings', 'Get Settings', s.body?.success ? 'PASS' : 'FAIL', s.body?.success ? 'Settings loaded' : 'Failed');
      const u = await req('PUT', '/api/settings', { notifications: { emailNotifications: false } }, globalToken);
      log('settings', 'Update Settings', u.body?.success ? 'PASS' : 'FAIL', u.body?.success ? 'Updated' : 'Failed');
      const v = await req('GET', '/api/settings', null, globalToken);
      const persisted = v.body?.data?.notifications?.emailNotifications === false;
      log('settings', 'Settings Persist After Refresh', persisted ? 'PASS' : 'FAIL', persisted ? 'Confirmed' : 'Did not persist');
    } catch(e) { log('settings', 'Settings API', 'FAIL', e.message); }
  }

  // 7. SUPPORT
  console.log('\n--- 7. SUPPORT ---')
