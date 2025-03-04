
import * as admin from 'firebase-admin';

// Check for environment variables
const hasEnvCredentials = process.env.FIREBASE_PROJECT_ID && 
                          process.env.FIREBASE_CLIENT_EMAIL && 
                          process.env.FIREBASE_PRIVATE_KEY;

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
    console.log('Firebase Admin environment variables missing. Initializing with minimal config.');
    
    // Initialize with a minimal default configuration
    // Use cert with empty values when applicationDefault is not available
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: 'trackedfr-prod',
        clientEmail: 'dummy@example.com',
        privateKey: 'dummy-key'
      }),
      projectId: 'trackedfr-prod',
    });
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  console.log('Continuing without Firebase Admin, some features may not work');
}

export { admin };
