import admin from "firebase-admin";

// Initialize Firebase Admin with environment variables
// This is more secure than including credentials in code
export async function initializeFirebaseAdmin() {
  try {
    // Check if Firebase Admin is already initialized
    if (admin.apps.length > 0) {
      console.log("Firebase Admin SDK already initialized");
      return admin;
    }

    console.log("Initializing Firebase Admin SDK...");

    // Check for required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    // Log which credentials are available (without exposing values)
    console.log(`Firebase Admin SDK credentials status:
      - Project ID: ${projectId ? 'Available' : 'Missing'}
      - Client Email: ${clientEmail ? 'Available' : 'Missing'}
      - Private Key: ${privateKeyRaw ? 'Available' : 'Missing'}`);

    if (!projectId || !clientEmail || !privateKeyRaw) {
      console.warn("Missing Firebase credentials. Running in limited mode.");
      // Create a minimal app with default config for both dev and prod
      const app = admin.initializeApp({
        projectId: projectId || 'demo-project',
      });
      console.log("Firebase Admin initialized with minimal configuration");
      return app;
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    const credential = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });

    const app = admin.initializeApp({
      credential,
    });

    console.log("Firebase Admin SDK initialized successfully!");
    return app;
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.warn("Continuing without Firebase Admin in development mode");
      return null;
    }
  }
}

export default admin;