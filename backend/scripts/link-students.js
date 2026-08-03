/**
 * Migration: Link existing students to colleges by email domain.
 * Usage: cd backend && node scripts/link-students.js
 *
 * Matches students to colleges where the student's email domain
 * matches a registered college domain (exact or subdomain match).
 * Run once, then auto-linking happens on registration.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const env = require('../src/config/env');
const { User, Student, College } = require('../src/models');

async function main() {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected\n');
  const colleges = await College.find({ emailDomains: { $exists: true, $not: { $size: 0 } } }).lean();
  if (!colleges.length) {
    console.log('No colleges with email domains found. Use seed or PUT /college/domains.');
    process.exit(0);
  }
  let total = 0;
  for (const c of colleges) {
    const domains = c.emailDomains.map(d => d.toLowerCase());
    console.log(c.collegeName + ': ' + domains.join(', ') + ' (ID: ' + c._id + ')');
    const users = await User.find({ role: 'student' }).lean();
    let linked = 0;
    for (const u of users) {
      const p = u.email.split('@');
      if (p.length < 2) continue;
      const domain = p[1].toLowerCase();
      const matches = domains.some(d => domain === d || domain.endsWith('.' + d));
      if (matches) {
        const r = await Student.updateOne(
          { userId: u._id },
          { $set: { collegeId: c._id } }
        );
        if (r.modifiedCount > 0) { linked++; console.log('  + ' + u.email); }
        else if (r.matchedCount > 0) { linked++; }
      }
    }
    console.log('  Linked ' + linked + ' students\n');
    total += linked;
  }
  const left = await Student.countDocuments({
    $or: [{ collegeId: null }, { collegeId: { $exists: false } }]
  });
  const totalStudents = await Student.countDocuments({});
  console.log('Result: ' + total + ' linked | ' + left + ' unlinked (of ' + totalStudents + ' total)');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
