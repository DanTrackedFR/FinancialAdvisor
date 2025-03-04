
import admin from 'firebase-admin';
import { log } from '../vite';

// Initialize Firebase Admin with environment variables or service account
let firebaseAdmin: admin.app.App | null = null;

export interface UserRecord {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
}

export async function initializeFirebaseAdmin() {
  try {
    // Check if required environment variables are set
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      log('Firebase Admin environment variables missing. Using default config.');
      
      // Initialize with application default credentials if available
      try {
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
        log('Firebase Admin SDK initialized with application default credentials.');
        return firebaseAdmin;
      } catch (error) {
        throw new Error('Failed to initialize with application default credentials');
      }
    }
    
    // Initialize with provided credentials
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Firebase private keys can be provided in various formats that need processing
        privateKey: privateKey.includes('\\n') 
          ? privateKey.replace(/\\n/g, '\n') 
          : privateKey.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----|"/g, '')
            .replace(/(.{64})/g, '$1\n')
            .replace(/^/, '-----BEGIN PRIVATE KEY-----\n')
            .replace(/$/, '\n-----END PRIVATE KEY-----'),
      }),
    });
    
    log('Firebase Admin SDK initialized successfully.');
    return firebaseAdmin;
  } catch (error) {
    log(`Firebase Admin initialization error: ${error}`);
    throw error;
  }
}

export function getFirebaseAdmin() {
  if (!firebaseAdmin) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return firebaseAdmin;
}

// Initialize Firebase Admin on module import
try {
  initializeFirebaseAdmin();
  log('Firebase Admin SDK imported successfully.');
} catch (error) {
  log('Continuing without Firebase Admin, some features may not work');
}

export default { initializeFirebaseAdmin, getFirebaseAdmin };
