const http = require('http');

const BASE = 'http://localhost:5000';

function api(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const RESULTS = { pass: 0, fail: 0, details: [] };

function check(name, passed, detail) {
  RESULTS.details.push({ name, passed, detail });
  if (passed) RESULTS.pass++; else RESULTS.fail++;
  console.log('  ' + (passed ? '✓' : '✗') + ' ' + name + ': ' + detail);
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   PLACEMUX COMPREHENSIVE WORKFLOW AUDIT');
  console.log('═══════════════════════════════════════════\n');

  // STUDENT WORKFLOWS
  console.log('─── STUDENT WORKFLOWS ───');
  
  const unique = Date.now();
  const studentEmail = 'st' + unique + '@test.edu';
  
  const r1 = await api('POST', '/auth/register', null, {
    name: 'Audit Student', email: studentEmail, password: 'password123', role: 'student'
  });
  check('Student Register', r1.status === 201 || r1.status === 200,
    r1.body?.success ? 'OK' : (r1.body?.error?.message || JSON.stringify(r1.body)));

  const studentToken = r1.body?.data?.token;

  const r2 = await api('POST', '/auth/login', null, {
    email: studentEmail, password: 'password123'
  });
  check('Student Login', r2.status === 200 && r2.body?.success,
    r2.body?.success ? 'OK' : (r2.body?.error?.message || 'Failed'));

  const loginToken = r2.body?.data?.token || studentToken;

  const r3 = await api('GET', '/auth/profile', loginToken);
  check('Student Profile', r3.status === 200 && r3.body?.success,
    r3.body?.success ? 'Has profile' : (r3.body?.error?.message || 'Failed'));

  const r4 = await api('PUT', '/auth/profile', loginToken, {
    name: 'Updated Audit Student', bio: 'CS Major'
  });
  check('Update Profile', r4.status === 200 && r4.body?.success,
    r4.body?.success ? 'Updated' : (r4.body?.error?.message || 'Failed'));

  const r5 = await api('GET', '/jobs', loginToken);
  check('View Jobs', r5.status === 200 && r5.body?.success,
    'Found ' + (r5.body?.data?.length || 0) + ' jobs');

  const activeJobs = (r5.body?.data || []).filter(j => j.status === 'active');
  if (activeJobs.length > 0) {
    const r6 = await api('POST', '/applications', loginToken, { jobId: activeJobs[0]._id });
    check('Apply to Job', r6.status === 201 && r6.body?.success,
      r6.body?.success ? 'Applied' : (r6.body?.error?.message || 'Failed'));
  } else {
    check('Apply to Job', false, 'No active jobs available');
  }

  const r7 = await api('GET', '/applications', loginToken);
  check('View Applications', r7.status === 200 && r7.body?.success,
    'Applications: ' + (r7.body?.data?.length || 0));

  const r8 = await api('GET', '/notifications', loginToken);
  check('View Notifications', r8.status === 200 && r8.body?.success,
    r8.body?.success ? 'OK' : (r8.body?.error?.message || 'Failed'));

  const r9 = await api('GET', '/assessments', loginToken);
  check('View Assessments', r9.status === 200 && r9.body?.success,
    'Assessments: ' + (r9.body?.data?.length || 0));

  const r10 = await api('GET', '/assessments/history', loginToken);
  check('Assessment History', r10.status === 200 && r10.body?.success,
    r10.body?.success ? 'OK' : (r10.body?.error?.message || 'Failed'));

  const r11 = await api('GET', '/offers', loginToken);
  check('View Offers', r11.status === 200 && r11.body?.success,
    'Offers: ' + (r11.body?.data?.length || 0));

  const r12 = await api('POST', '/auth/logout', loginToken);
  check('Logout', r12.status === 200 && r12.body?.success,
    r12.body?.success ? 'OK' : (r12.body?.error?.message || 'Failed'));

  // COMPANY WORKFLOWS
  console.log('\n─── COMPANY WORKFLOWS ───');
  
  const companyEmail = 'co' + unique + '@techcorp.com';
  
  const r13 = await api('POST', '/auth/register', null, {
    name: 'Audit Company', email: companyEmail, password: 'password123', role: 'company'
  });
  check('Company Register', r13.status === 201 || r13.status === 200,
    r13.body?.success ? 'OK' : (r13.body?.error?.message || 'Failed'));

  const companyToken = r13.body?.data?.token;

  const r14 = await api('POST', '/auth/login', null, {
    email: companyEmail, password: 'password123'
  });
  check('Company Login', r14.status === 200 && r14.body?.success,
    r14.body?.success ? 'OK' : (r14.body?.error?.message || 'Failed'));

  const compToken = r14.body?.data?.token || companyToken;

  const r15 = await api('POST', '/jobs', compToken, {
    title: 'Software Engineer', description: 'Build great products',
    location: 'Bangalore', type: 'Full-time',
    salaryMin: 800000, salaryMax: 1500000,
    skillsRequired: ['JavaScript', 'React', 'Node.js']
  });
  check('Create Job', r15.status === 201 && r15.body?.success,
    r15.body?.success ? 'Job created' : (r15.body?.error?.message || 'Failed'));

  const jobId = r15.body?.data?._id;
  if (jobId) {
    const r16 = await api('PUT', '/jobs/' + jobId, compToken, { status: 'active' });
    check('Edit/Activate Job', r16.status === 200 && r16.body?.success,
      r16.body?.success ? 'Activated' : (r16.body?.error?.message || 'Failed'));
  }

  const rDel = await api('POST', '/jobs', compToken, {
    title: 'Temp Job', description: 'To delete', location: 'Remote', type: 'Contract'
  });
  const delJobId = rDel.body?.data?._id;
  if (delJobId) {
    const r17 = await api('DELETE', '/jobs/' + delJobId, compToken);
    check('Delete Job', r17.status === 200 && r17.body?.success,
      r17.body?.success ? 'Deleted' : (r17.body?.error?.message || 'Failed'));
  }

  const r18 = await api('GET', '/applications', compToken);
  check('View Applicants', r18.status === 200 && r18.body?.success,
    'Applicants: ' + (r18.body?.data?.length || 0));

  const r19 = await api('POST', '/assessments', compToken, {
    title: 'Technical Assessment', description: 'JS & React',
    type: 'technical', duration: 30, passingScore: 60
  });
  check('Create Assessment', r19.status === 201 && r19.body?.success,
    r19.body?.success ? 'Assessment created' : (r19.body?.error?.message || 'Failed'));

  const assessmentId = r19.body?.data?._id;
  if (assessmentId) {
    const r20 = await api('POST', '/assessments/' + assessmentId + '/questions', compToken, {
      questions: [
        { questionText: 'What is React?', options: ['Library', 'Framework', 'Language', 'DB'], correctIndex: 0, points: 10 },
        { questionText: 'What is Node.js?', options: ['Runtime', 'Framework', 'Language', 'DB'], correctIndex: 0, points: 10 },
      ]
    });
    check('Add Questions', r20.status === 201 && r20.body?.success,
      r20.body?.success ? 'Questions added' : (r20.body?.error?.message || 'Failed'));
  }

  const r21 = await api('GET', '/interviews', compToken);
  check('View Interviews', r21.status === 200 && r21.body?.success,
    r21.body?.success ? 'OK' : (r21.body?.error?.message || 'Failed'));

  const r22 = await api('GET', '/assessments/results', compToken);
  check('Assessment Results', r22.status === 200 && r22.body?.success,
    r22.body?.success ? ('Results: ' + ((r22.body?.data?.results || []).length)) : (r22.body?.error?.message || 'Failed'));

  // COLLEGE WORKFLOWS
  console.log('\n─── COLLEGE/TPO WORKFLOWS ───');
  
  const collegeEmail = 'col' + unique + '@example.com';
  
  const r23 = await api('POST', '/auth/register', null, {
    name
