/**
 * ProctoringEvent Enum Verification Script
 * 
 * Tests that ALL event types in the proctoring event enum can be 
 * persisted to MongoDB without Mongoose ValidationError.
 * 
 * Usage: node scripts/verify-proctoring-enum.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Load env
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/placemux';

const ALL_EVENT_TYPES = [
  'tab_switch',
  'fullscreen_exit',
  'camera_disconnect',
  'keyboard_shortcut',
  'multiple_faces',
  'face_not_visible',
  'suspicious_activity',
  'camera_health',
  'copy_paste',
  'browser_blur',
  'phone_disconnected',
  'audio_multiple_voices',
  'object_detected_phone',
  'object_detected_book',
  'camera_quality_degraded',
  'face_not_matched',
  'looking_away',
  'devtools_opened',
  'ice_failed',
  'reconnected',
];

const SEVERITIES = ['info', 'warning', 'critical'];

async function main() {
  console.log('='.repeat(60));
  console.log('  PROCTORING EVENT ENUM VERIFICATION');
  console.log('='.repeat(60));
  console.log(`  MongoDB URI: ${MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`  Total event types to test: ${ALL_EVENT_TYPES.length}`);
  console.log('');

  console.log('  [1/4] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('  OK Connected');

  const ProctoringEvent = require('../src/models/ProctoringEvent');

  const schemaEnum = ProctoringEvent.schema.path('eventType').enumValues;
  console.log(`\n  [2/4] Schema enum has ${schemaEnum.length} values`);
  console.log(`  Schema enum: ${JSON.stringify(schemaEnum)}`);
  console.log('');

  const missing = ALL_EVENT_TYPES.filter(t => !schemaEnum.includes(t));
  if (missing.length > 0) {
    console.log(`  FAIL: ${missing.length} event types missing from schema enum:`);
    missing.forEach(t => console.log(`    - ${t}`));
    process.exit(1);
  }
  console.log('  OK All 20 event types present in schema enum');

  const extra = schemaEnum.filter(t => !ALL_EVENT_TYPES.includes(t));
  if (extra.length > 0) {
    console.log(`  i Schema has ${extra.length} extra type(s): ${extra.join(', ')}`);
  }

  const dummyId = new mongoose.Types.ObjectId();

  console.log(`\n  [3/4] Testing persistence of all ${ALL_EVENT_TYPES.length} event types...`);
  console.log('');

  const createdIds = [];
  const errors = [];

  for (let i = 0; i < ALL_EVENT_TYPES.length; i++) {
    const eventType = ALL_EVENT_TYPES[i];
    const severity = SEVERITIES[i % SEVERITIES.length];

    try {
      const doc = await ProctoringEvent.create({
        sessionId: dummyId,
        studentId: dummyId,
        eventType,
        severity,
        details: `Verification test for ${eventType}`,
        timestamp: new Date(),
      });

      createdIds.push({ eventType, id: doc._id.toString(), severity });
      process.stdout.write(`  OK ${String(i + 1).padStart(2, ' ')}/${ALL_EVENT_TYPES.length} ${eventType.padEnd(28)} -> ${doc._id}\n`);
    } catch (err) {
      errors.push({ eventType, message: err.message });
      process.stdout.write(`  FAIL ${String(i + 1).padStart(2, ' ')}/${ALL_EVENT_TYPES.length} ${eventType.padEnd(28)} -> VALIDATION ERROR: ${err.message}\n`);
    }
  }

  console.log('');
  console.log('='.repeat(60));

  if (errors.length === 0) {
    console.log('  OK VERIFICATION PASSED - Zero validation errors');
    console.log('  OK ' + createdIds.length + ' events persisted successfully');
    console.log('');
    console.log('  Saved document IDs:');
    createdIds.forEach(({ eventType, id, severity }) => {
      console.log('    ' + eventType.padEnd(28) + ' ' + id + ' (' + severity + ')');
    });
  } else {
    console.log('  FAIL VERIFICATION FAILED - ' + errors.length + ' validation error(s):');
    errors.forEach(({ eventType, message }) => {
      console.log('    ' + eventType + ': ' + message);
    });
  }

  console.log('');
  console.log('  [4/4] Cleaning up test documents...');
  const deleteResult = await ProctoringEvent.deleteMany({ sessionId: dummyId });
  console.log('  OK Removed ' + deleteResult.deletedCount + ' test documents');
  console.log('');

  await mongoose.disconnect();
  console.log('  OK Disconnected');
  console.log('='.repeat(60));

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
