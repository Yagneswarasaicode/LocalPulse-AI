import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Default project configuration for LocalPulse AI
const DEFAULT_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'localpulse-ai-demo';

// Ensure emulator environment variables are set for local execution if not in production
if (process.env.NODE_ENV !== 'production') {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  }
  if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
  }
}

let initialized = false;
let adminApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let firebaseStorage = null;

export function initializeFirebaseAdmin() {
  if (initialized && adminApp) {
    return { adminApp, firestoreDb, firebaseAuth, firebaseStorage };
  }

  try {
    const existingApps = getApps();
    if (existingApps.length === 0) {
      // In local emulator mode, default project ID is sufficient without service account credentials
      adminApp = initializeApp({
        projectId: DEFAULT_PROJECT_ID,
        storageBucket: `${DEFAULT_PROJECT_ID}.appspot.com`,
      });
      console.log(`[Firebase Admin] Initialized for project "${DEFAULT_PROJECT_ID}" (Emulator mode: ${Boolean(process.env.FIRESTORE_EMULATOR_HOST)})`);
    } else {
      adminApp = existingApps[0];
    }

    firestoreDb = getFirestore(adminApp);
    firebaseAuth = getAuth(adminApp);
    firebaseStorage = getStorage(adminApp);
    initialized = true;

    return { adminApp, firestoreDb, firebaseAuth, firebaseStorage };
  } catch (error) {
    console.warn('[Firebase Admin] Initialization warning:', error.message);
    return { adminApp: null, firestoreDb: null, firebaseAuth: null, firebaseStorage: null, error: error.message };
  }
}

export function getFirebaseAdmin() {
  if (!initialized) initializeFirebaseAdmin();
  return { adminApp, firestoreDb, firebaseAuth, firebaseStorage };
}

export function getAdminStatus() {
  return {
    initialized,
    projectId: DEFAULT_PROJECT_ID,
    isEmulator: Boolean(process.env.FIRESTORE_EMULATOR_HOST),
    emulators: {
      firestore: process.env.FIRESTORE_EMULATOR_HOST || 'disabled',
      auth: process.env.FIREBASE_AUTH_EMULATOR_HOST || 'disabled',
      storage: process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'disabled',
    },
  };
}
