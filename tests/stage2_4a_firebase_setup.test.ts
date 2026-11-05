import assert from 'assert';
import fs from 'fs';
import path from 'path';

async function runStage2_4ATests() {
  console.log('====================================================');
  console.log('LOCALPULSE AI — STAGE 2.4A FIREBASE SETUP TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // Suite 1: Firebase Project & Emulator Configuration
  console.log('Suite 1: Firebase Configuration Files & Ports');
  
  await test('firebase.json exists and defines emulator ports', () => {
    assert(fs.existsSync('firebase.json'), 'firebase.json should exist');
    const content = JSON.parse(fs.readFileSync('firebase.json', 'utf-8'));
    assert.strictEqual(content.emulators.firestore.port, 8080);
    assert.strictEqual(content.emulators.auth.port, 9099);
    assert.strictEqual(content.emulators.storage.port, 9199);
    assert.strictEqual(content.emulators.ui.port, 4000);
  });

  await test('.firebaserc defines verified production project id localpulse-ai-a990f', () => {
    assert(fs.existsSync('.firebaserc'), '.firebaserc should exist');
    const content = JSON.parse(fs.readFileSync('.firebaserc', 'utf-8'));
    assert.strictEqual(content.projects.default, 'localpulse-ai-a990f');
  });

  await test('firestore.indexes.json defines required composite indexes', () => {
    assert(fs.existsSync('firestore.indexes.json'), 'firestore.indexes.json should exist');
    const content = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf-8'));
    assert(Array.isArray(content.indexes), 'Indexes should be an array');
    assert(content.indexes.length >= 4, 'Should define at least 4 composite indexes');
    const invIndex = content.indexes.find((i: any) => i.collectionGroup === 'inventory');
    assert(invIndex, 'Inventory index must be defined');
  });

  await test('.env.example documents verified project ID localpulse-ai-a990f and intentional emulator controls', () => {
    const envExample = fs.readFileSync('.env.example', 'utf-8');
    assert(envExample.includes('localpulse-ai-a990f'), 'Must document production project ID localpulse-ai-a990f');
    assert(envExample.includes('USE_FIREBASE_EMULATOR'), 'Must document USE_FIREBASE_EMULATOR toggle');
    assert(envExample.includes('VITE_USE_FIREBASE_EMULATOR'), 'Must document VITE_USE_FIREBASE_EMULATOR toggle');
    assert(envExample.includes('FIRESTORE_EMULATOR_HOST'), 'Must document FIRESTORE_EMULATOR_HOST');
  });

  // Suite 2: Firebase Client & Admin Initialization Modules
  console.log('\nSuite 2: Firebase Initialization Modules');

  await test('src/config/firebase.ts configures localpulse-ai-a990f and intentional emulator connectivity', () => {
    assert(fs.existsSync('src/config/firebase.ts'), 'src/config/firebase.ts should exist');
    const clientCode = fs.readFileSync('src/config/firebase.ts', 'utf-8');
    assert(clientCode.includes('localpulse-ai-a990f'), 'Must configure production project localpulse-ai-a990f');
    assert(clientCode.includes('connectFirestoreEmulator'), 'Must support Firestore emulator');
    assert(clientCode.includes('connectAuthEmulator'), 'Must support Auth emulator');
    assert(clientCode.includes('connectStorageEmulator'), 'Must support Storage emulator');
  });

  await test('server/services/FirebaseAdmin.js configures localpulse-ai-a990f and exports initialization functions', () => {
    assert(fs.existsSync('server/services/FirebaseAdmin.js'), 'server/services/FirebaseAdmin.js should exist');
    const adminCode = fs.readFileSync('server/services/FirebaseAdmin.js', 'utf-8');
    assert(adminCode.includes('localpulse-ai-a990f'), 'Must configure production project localpulse-ai-a990f');
    assert(adminCode.includes('initializeFirebaseAdmin'), 'Must export initializeFirebaseAdmin');
    assert(adminCode.includes('getAdminStatus'), 'Must export getAdminStatus');
  });

  // Suite 3: Runtime SDK Loading & Status Verification
  console.log('\nSuite 3: Runtime SDK Loading & Status Verification');

  await test('Firebase Admin SDK loads and reports verified production project ID localpulse-ai-a990f', async () => {
    // Set emulator toggle to true for test execution
    process.env.USE_FIREBASE_EMULATOR = 'true';
    const { initializeFirebaseAdmin, getAdminStatus } = await import('../server/services/FirebaseAdmin.js');
    const initResult = initializeFirebaseAdmin();
    assert(initResult.adminApp !== null, 'adminApp should initialize');
    assert(initResult.firestoreDb !== null, 'firestoreDb should initialize');
    assert(initResult.firebaseAuth !== null, 'firebaseAuth should initialize');
    assert(initResult.firebaseStorage !== null, 'firebaseStorage should initialize');

    const status = getAdminStatus();
    assert.strictEqual(status.initialized, true);
    assert.strictEqual(status.projectId, 'localpulse-ai-a990f');
    assert.strictEqual(status.isEmulator, true);
    assert.strictEqual(status.emulators.firestore, 'localhost:8080');
    assert.strictEqual(status.emulators.auth, 'localhost:9099');
    assert.strictEqual(status.emulators.storage, 'localhost:9199');
  });

  console.log('\n====================================================');
  console.log(`STAGE 2.4A TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage2_4ATests();
