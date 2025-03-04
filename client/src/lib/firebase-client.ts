
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebase configuration object with Vite environment variables and fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDlGZDKiXkljNzYkK2Ry9SbX4J6bqZUqFI",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "trackedfr-prod"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trackedfr-prod",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "trackedfr-prod"}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "857363648999",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:857363648999:web:ec2fe37eeab2258defed42",
};

// Debug output for troubleshooting
console.log("Firebase Config Debug:", {
  apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
  projectId: firebaseConfig.projectId ? "Present" : "Missing",
  appId: firebaseConfig.appId ? "Present" : "Missing"
});

// Get current domain to help with configuration
const currentDomain = typeof window !== 'undefined' ? window.location.host : '';
console.log("Current domain:", currentDomain);

// Initialize Firebase
let app;
let auth;

const initializeFirebase = () => {
  try {
    if (getApps().length === 0) {
      console.log("Firebase configuration:", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain
      });
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    auth = getAuth(app);
    
    // If running in development, connect to the Firebase emulator
    if (process.env.NODE_ENV === 'development' || currentDomain.includes('localhost') || currentDomain.includes('.replit.dev')) {
      try {
        // Check for emulator environment before connecting
        if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
          connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
          console.log("Connected to Firebase Auth emulator");
        }
      } catch (emulatorError) {
        console.error("Error connecting to Auth emulator:", emulatorError);
      }
    }
    
    console.log("Firebase initialized successfully");
    return { app, auth };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
};

// Initialize Firebase on module import
try {
  const { auth: initializedAuth } = initializeFirebase();
  auth = initializedAuth;
} catch (error) {
  console.error("Error during Firebase initialization:", error);
}

export { auth, initializeFirebase };
