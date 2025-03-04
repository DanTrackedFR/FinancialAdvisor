
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps || admin.apps.length === 0) {
  try {
    // Check for environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    // Basic validation
    if (!privateKey || !clientEmail || !projectId) {
      console.warn('Firebase Admin environment variables missing. Initializing with minimal config.');
      
      // Initialize with empty config if env vars not available
      admin.initializeApp();
    } else {
      // Initialize with environment variables
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // Don't throw here, just log the error
    console.error('Continuing without Firebase Admin, some features may not work');
  }
}

// Safely export admin services
export default admin;

// Safely export auth and firestore (with fallbacks if not available)
export const auth = admin.auth ? admin.auth() : null;
export const firestore = admin.firestore ? admin.firestore() : null;
