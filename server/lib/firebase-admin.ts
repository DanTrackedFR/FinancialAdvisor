
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Check for environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    // Basic validation
    if (!privateKey || !clientEmail || !projectId) {
      console.warn('Firebase Admin environment variables missing. Using service account file if available.');
      
      // Try to use service account file if environment variables are not set
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
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
    throw new Error('Failed to initialize Firebase Admin');
  }
}

export default admin;
export const auth = admin.auth();
export const firestore = admin.firestore();
