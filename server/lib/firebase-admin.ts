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
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    // Log which credentials are available (without exposing values)
    console.log(`Firebase Admin SDK credentials status:
      - Project ID: ${projectId ? 'Available' : 'Missing'}
      - Client Email: ${clientEmail ? 'Available' : 'Missing'}
      - Private Key: ${privateKeyRaw ? 'Available' : 'Missing'}`);

    let appOptions: admin.AppOptions = {};

    if (!projectId || !clientEmail || !privateKeyRaw) {
      console.warn("Missing Firebase credentials. Running in application default credentials mode.");
      
      // For production deployments on Firebase Hosting, use application default credentials
      if (process.env.NODE_ENV === 'production') {
        console.log("Production environment detected, using application default credentials");
        appOptions = {
          projectId: projectId || 'trackedfr',
        };
      } else {
        // For development, use a minimal configuration
        console.log("Development environment detected, using minimal configuration");
        appOptions = {
          projectId: projectId || 'trackedfr',
        };
      }
    } else {
      // Using service account credentials
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
      appOptions = {
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      };
      console.log("Using service account credentials for Firebase Admin");
    }

    // Initialize the app with the appropriate configuration
    const app = admin.initializeApp(appOptions);

    // Log information about custom domain for token verification
    const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
    const customDomains = [];
    
    if (authDomain) {
      customDomains.push(authDomain);
      // Also consider www subdomain
      if (authDomain.indexOf('www.') !== 0) {
        customDomains.push(`www.${authDomain}`);
      }
      
      console.log(`Firebase Admin SDK configured for custom domains: ${customDomains.join(', ')}`);
      console.log(`Important: Make sure all these domains are added to Firebase Console > Authentication > Settings > Authorized domains`);
    }

    // Configure Auth settings (if needed for custom domain token verification)
    // Note: This is typically handled automatically by Firebase based on the Console settings
    
    console.log("Firebase Admin SDK initialized successfully!");
    return app;
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    if (process.env.NODE_ENV === 'production') {
      console.error("Firebase Admin initialization failed in production mode:", error);
      throw error;
    } else {
      console.warn("Continuing without Firebase Admin in development mode");
      return null;
    }
  }
}

/**
 * Helper function to check if a domain is an authorized domain for Firebase Auth
 * This can be used in auth middleware to provide better error messages
 */
export function isAuthorizedDomain(domain: string): boolean {
  const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
  
  if (!authDomain || !domain) return false;
  
  // List of authorized domains (add any additional domains here)
  const authorizedDomains = [
    authDomain,
    `www.${authDomain}`,
    `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    `${process.env.VITE_FIREBASE_PROJECT_ID}.web.app`
  ];
  
  return authorizedDomains.includes(domain);
}

export default admin;