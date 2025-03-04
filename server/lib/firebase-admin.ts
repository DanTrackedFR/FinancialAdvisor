
import * as admin from 'firebase-admin';

// Check for environment variables
const hasEnvCredentials = process.env.FIREBASE_PROJECT_ID && 
                          process.env.FIREBASE_CLIENT_EMAIL && 
                          process.env.FIREBASE_PRIVATE_KEY;

// Initialize Firebase Admin once
let firebaseAdmin: typeof admin | null = null;

try {
  if (hasEnvCredentials) {
    // Initialize with environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key needs to be properly formatted
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized with environment variables');
  } else {
    console.log('Firebase Admin environment variables missing. Using default config.');
    
    // Initialize with a minimal default configuration without credential for development
    admin.initializeApp({
      projectId: 'trackedfr-prod',
    });
    console.log('Firebase Admin SDK initialized with default configuration');
  }
  
  // Store the initialized admin instance
  firebaseAdmin = admin;
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  console.log('Continuing without Firebase Admin, some features may not work');
}

// Export the initialized Firebase Admin SDK
export { firebaseAdmin as admin };
