require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const env = require('../src/config/env');

async function cleanup() {
  await mongoose.connect(env.mongodbUri);
  const db = mongoose.connection.db;
  console.log('Connected to MongoDB\n');

  // 1. Clean up proctoring events (keep 100)
  const allPE = await db.collection('proctoringevents').countDocuments();
  const recentPE = await db.collection('proctoringevents')
    .find({}, { sort: { createdAt: -1 }, projection: { _id: 1 } })
    .limit(100).toArray();
  const recentIds = recentPE.map(d => d._id);
  const delResult = await db.collection('proctoringevents').deleteMany({ _id: { $nin: recentIds } });
  console.log('Proctoring events: ' + allPE + ' total -> kept 100, deleted ' + delResult.deletedCount);

  // 2. Clean up orphaned student settings
  const users = await db.collection('users').find({}).toArray();
  const userIds = users.map(u => u._id.toString());
  const ssTotal = await db.collection('studentsettings').countDocuments();
  const delSS1 = await db.collection('studentsettings').deleteMany({
    $or: [{ userId: { $exists: false } }, { userId: null }]
  });
  const validSS = await db.collection('studentsettings').find({ userId: { $exists: true, $ne: null } }).toArray();
  let delSS2 = 0;
  for (const s of validSS) {
    const uid = typeof s.userId === 'object' ? s.userId.toString() : s.userId;
    if (!userIds.includes(uid)) {
      await db.collection('studentsettings').deleteOne({ _id: s._id });
      delSS2++;
    }
  }
  console.log('Student settings: ' + ssTotal + ' total -> deleted ' + (delSS1.deletedCount + delSS2) + ' orphaned');

  // 3. Clean up orphaned skill passports
  const students = await db.collection('students').find({}).toArray();
  const studentIds = students.map(s => s._id.toString());
  const spTotal = await db.collection('skillpassports').countDocuments();
  const delSP1 = await db.collection('skillpassports').deleteMany({
    $or: [{ studentId: { $exists: false } }, { studentId: null }]
  });
  const validSP = await db.collection('skillpassports').find({ studentId: { $exists: true, $ne: null } }).toArray();
  let delSP2 = 0;
  for (const s of validSP) {
    const sid = typeof s.studentId === 'object' ? s.studentId.toString() : s.studentId;
    if (!studentIds.includes(sid)) {
      await db.collection('skillpassports').deleteOne({ _id: s._id });
      delSP2++;
    }
  }
  console.log('Skill passports: ' + spTotal + ' total -> deleted ' + (delSP1.deletedCount + delSP2) + ' orphaned');

  // 4. Create platform setting if missing
  const psCount = await db.collection('platformsettings').countDocuments();
  if (psCount === 0) {
    await db.collection('platformsettings').insertOne({
      platformName: 'PlaceMux', supportEmail: 'support@placemux.com',
      sessionTimeout: 60, maxLoginAttempts: 5, passwordMinLength: 8,
      createdAt: new Date(), updatedAt: new Date()
    });
    console.log('Platform settings: created default');
  }

  // Final state
  console.log('\n--- FINAL DATABASE STATE ---');
  const collections = await db.listCollections().toArray();
  for (const { name } of collections) {
    const count = await db.collection(name).countDocuments();
    console.log('  ' + name + ': ' + count + ' docs');
  }
  await mongoose.disconnect();
  console.log('\nCleanup complete!');
}

cleanup().catch(err => { console.error(err); process.exit(1); });
