
import * as admin from 'firebase-admin';

import * as admin from 'firebase-admin';

let firebaseAdmin: admin.app.App;

try {
  // Check if an app has already been initialized
  try {
    firebaseAdmin = admin.app();
    console.log("Firebase Admin app already initialized, reusing existing app");
  } catch (error) {
    // No app exists, initialize a new one
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      // Initialize with environment variables
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      console.log("Firebase Admin SDK initialized with provided credentials");
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Initialize with application default credentials
      firebaseAdmin = admin.initializeApp();
      console.log("Firebase Admin SDK initialized with application default credentials");
    } else {
      // Initialize with minimal config for development
      console.log("Firebase Admin environment variables missing. Initializing with minimal config.");
      firebaseAdmin = admin.initializeApp({
        projectId: 'trackedfr-prod',
      });
    }
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  console.log("Continuing without Firebase Admin, some features may not work");
}

export default firebaseAdmin;
