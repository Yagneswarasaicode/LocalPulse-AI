import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Production Firebase Configuration for LocalPulse AI (localpulse-ai-a990f)
const PRODUCTION_PROJECT_ID = 'localpulse-ai-a990f';
const PRODUCTION_STORAGE_BUCKET = 'localpulse-ai-a990f.firebasestorage.app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoDummyKeyForLocalPulse12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${PRODUCTION_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || PRODUCTION_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || PRODUCTION_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize or reuse existing Firebase app instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Intentional emulator configuration: only connect if explicitly requested via VITE_USE_FIREBASE_EMULATOR === 'true'
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

let emulatorsConnected = false;

export function connectEmulatorsOnce(): void {
  if (emulatorsConnected) return;

  if (useEmulator) {
    try {
      // Connect to Firestore Emulator (Port 8080)
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('[Firebase Client] Connected to Firestore Emulator on http://localhost:8080');
    } catch (e) {
      // Already connected or failed
    }

    try {
      // Connect to Auth Emulator (Port 9099)
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('[Firebase Client] Connected to Auth Emulator on http://localhost:9099');
    } catch (e) {
      // Already connected or failed
    }

    try {
      // Connect to Storage Emulator (Port 9199)
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('[Firebase Client] Connected to Storage Emulator on http://localhost:9199');
    } catch (e) {
      // Already connected or failed
    }

    emulatorsConnected = true;
  }
}

// Auto-connect when intentional emulator mode is active
if (typeof window !== 'undefined' && useEmulator) {
  connectEmulatorsOnce();
}

export function isEmulatorConfigured(): boolean {
  return useEmulator;
}

export { app, auth, db, storage };
