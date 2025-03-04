
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDlGZDKiXkljNzYkK2Ry9SbX4J6bqZUqFI",
  authDomain: `${process.env.FIREBASE_PROJECT_ID || "trackedfr-prod"}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID || "trackedfr-prod",
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || "trackedfr-prod"}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "857363648999",
  appId: process.env.FIREBASE_APP_ID || "1:857363648999:web:ec2fe37eeab2258defed42",
};

// Debug info for deployment troubleshooting
console.log("Firebase Config Debug:", {
  apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
  projectId: firebaseConfig.projectId ? "Present" : "Missing",
  appId: firebaseConfig.appId ? "Present" : "Missing"
});

// Get current domain to help with configuration
const currentDomain = window.location.hostname;
console.log("Current domain:", currentDomain);

let app;
let auth;

// Export the initialization function
export const initializeFirebase = () => {
  try {
    // Avoid duplicate Firebase initialization
    try {
      // Check if Firebase is already initialized
      app = initializeApp(firebaseConfig);
    } catch (error) {
      if (error.code === 'app/duplicate-app') {
        console.log("Firebase already initialized, getting existing app");
        app = initializeApp();
      } else {
        throw error;
      }
    }
    
    auth = getAuth(app);

    // Only connect to auth emulator in development mode
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      connectAuthEmulator(auth, "http://localhost:9099");
    }

    console.log("Firebase configuration:", {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
    });

    console.log("Firebase initialized successfully");
    return { app, auth };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return { app: null, auth: null };
  }
};

try {
  // Initialize Firebase on module import
  const { auth: initializedAuth } = initializeFirebase();
  auth = initializedAuth;
} catch (error) {
  console.error("Firebase auto-initialization error:", error);
}

export { auth };
