
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
      console.warn('Firebase Admin environment variables missing. Using application default credentials if available.');
      
      // Try to use application default credentials if environment variables are not set
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
    // Don't throw here, just log the error
    console.error('Continuing without Firebase Admin, some features may not work');
  }
}

export default admin;
export const auth = admin.auth();
export const firestore = admin.firestore();
