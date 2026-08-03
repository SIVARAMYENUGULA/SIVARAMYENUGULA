require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
var API = 'http://localhost:5000/api';
var http = require('http');
function req(method, path, body, token, timeout) {
  return new Promise(function(resolve) {
    if (!timeout) timeout = 15000;
    var timedOut = false;
    var t = setTimeout(function() { timedOut = true; resolve({ok:false, error:'TIMEOUT', elapsed:timeout}); }, timeout);
    var start = Date.now();
    var url = new URL(API + path);
    var opts = { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: method, headers: {'Content-Type': 'application/json'}, timeout: timeout };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    var r = http.request(opts, function(res) {
      var d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
        if (timedOut) return;
        clearTimeout(t);
        try { var j = JSON.parse(d); resolve({ok:true, elapsed:Date.now()-start, success:j.success, message:j.message, data:j.data, code:res.statusCode}); }
        catch(e) { resolve({ok:true, elapsed:Date.now()-start, raw:d, code:res.statusCode}); }
      });
    });
    r.on('error', function(e) { if (!timedOut) { clearTimeout(t); resolve({ok:false, error:e.message, elapsed:Date.now()-start}); }});
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  var results = [];
  var step = function(n) { console.log('STEP ' + n); };
  
  step('1a: Company Login');
  var r = await req('POST', '/auth/login', {email:'shabirsk989+company@gmail.com', password:'Company@123'});
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
  var ct = r.data && r.data.token;
  if (!ct) { console.log('FATAL: No company token'); return; }
  
  step('1b: Company Profile');
  r = await req('GET', '/auth/profile', null, ct);
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
  var cid = r.data && r.data.profile && r.data.profile._id;
  
  step('1c: Create Job');
  r = await req('POST', '/jobs', {title:'Workflow Test Job', description:'Testing full workflow', location:'Remote', type:'Full-time', salaryMin:800000, salaryMax:1500000}, ct);
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.code || ''));
  var jid = r.data && r.data._id;
  var jt = 'Workflow Test Job';
  if (!jid) { console.log('FATAL: No job ID created'); return; }
  
  step('2a: Student Login');
  r = await req('POST', '/auth/login', {email:'shabirsk989+student@gmail.com', password:'Student@123'});
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
  var st = r.data && r.data.token;
  if (!st) { console.log('FATAL: No student token'); return; }
  
  step('2b: Student Profile');
  r = await req('GET', '/auth/profile', null, st);
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
  var sn = r.data && r.data.user && r.data.user.name;
  var sid = r.data && r.data.profile && r.data.profile._id;
  
  step('3: Apply to Job');
  r = await req('POST', '/applications', {jobId:jid, coverLetter:'Full workflow test'}, st);
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.code || '') + ' - ' + (r.message || ''));
  var aid = r.data && r.data._id;
  if (!aid) { console.log('WARN: No application ID. Trying to find existing...'); }
  
  step('4: Shortlist');
  if (aid) {
    r = await req('PUT', '/applications/'+aid+'/status', {status:'Shortlisted'}, ct);
    console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.message || ''));
  }
  
  step('5a: Create Assessment');
  r = await req('POST', '/assessments', {title:'Workflow Test', type:'Technical', duration:30, passingScore:60}, ct);
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.message || ''));
  var asid = r.data && r.data._id;
  
  step('5b: Add Questions');
  if (asid) {
    r = await req('POST', '/assessments/'+asid+'/questions', {questions:[{questionText:'Q1',options:['A','B','C','D'],correctIndex:1,points:10},{questionText:'Q2',options:['W','X','Y','Z'],correctIndex:2,points:10}]}, ct);
    console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
  }
  
  step('5c: Assign Assessment');
  if (asid && sid) {
    r = await req('POST', '/assessments/'+asid+'/assign', {studentIds:[sid]}, ct);
    console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.message || ''));
  }
  
  step('6a: Start Assessment');
  if (asid) {
    r = await req('POST', '/assessments/'+asid+'/start', {}, st);
    console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.message || ''));
  }
  
  step('6b: Submit Assessment');
  if (asid) {
    r = await req('POST', '/assessments/'+asid+'/submit', {answers:[{questionIndex:0,selectedIndex:1},{questionIndex:1,selectedIndex:2}]}, st);
    console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.message || '') + ' Score: ' + ((r.data && r.data.score) || '?'));
  }
  
  step('7: Company Results');
  r = await req('GET', '/assessments/company/results', null, ct);
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
  
  step('8: Schedule Interview');
  if (cid && jid && aid && sid) {
    r = await req('POST', '/interviews', {companyId:cid, jobId:jid, applicationId:aid, studentId:sid, candidateName:sn||'Arjun Mehta', jobTitle:jt, date:'2026-06-20T10:00:00Z', time:'10:00', meetingLink:'https://meet.google.com/test', type:'Technical'}, ct);
    console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.message || ''));
  }
  
  step('9: Student Interviews');
  r = await req('GET', '/interviews/upcoming', null, st);
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
  
  step('10a: Create Offer');
  if (cid && jid && aid && sid) {
    r = await req('POST', '/offers', {companyId:cid, jobId:jid, applicationId:aid, studentId:sid, candidateName:sn||'Arjun Mehta', jobTitle:jt, package:1200000, joiningDate:'2026-07-01'}, ct);
    console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.message || ''));
    var ofid = r.data && r.data._id;
    
    step('10b: Send Offer');
    if (ofid) {
      r = await req('POST', '/offers/'+ofid+'/send', {expiryDate:'2026-07-15'}, ct);
      console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.message || ''));
      
      step('10c: Accept Offer');
      r = await req('POST', '/offers/'+ofid+'/accept', {}, st);
      console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms) - ' + (r.message || ''));
    }
  }
  
  step('11a: College Login');
  r = await req('POST', '/auth/login', {email:'shabirsk989+college@gmail.com', password:'College@123'});
  console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
  var clt = r.data && r.data.token;
  
  if (clt) {
    step('11b: College Dashboard');
    r = await req('GET', '/college/dashboard', null, clt);
    console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
    
    step('11c: College Analytics');
    r = await req('GET', '/college/analytics', null, clt);
    console.log('  ' + (r.ok ? 'OK' : 'FAIL') + ' (' + r.elapsed + 'ms)');
  }
  
  console.log('\n=== WORKFLOW TEST COMPLETE ===');
}
main().catch(function(e) { console.log('FATAL:', e.message); });
