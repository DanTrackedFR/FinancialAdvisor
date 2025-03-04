
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebase configuration object with Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDlGZDKiXkljNzYkK2Ry9SbX4J6bqZUqFI",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "trackedfr-prod"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trackedfr-prod",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "trackedfr-prod"}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "857363648999",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:857363648999:web:ec2fe37eeab2258defed42",
};

// Debug info for deployment troubleshooting
console.log("Firebase Config:", firebaseConfig);

// Get current domain to help with configuration
const currentDomain = window.location.host;
console.log("Current domain:", currentDomain);

// Initialize Firebase
let app;
let auth;

export const initializeFirebase = () => {
  try {
    // Avoid duplicate Firebase initialization
    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized");
    }
    
    if (!auth) {
      auth = getAuth(app);
      console.log("Firebase auth initialized");
    }

    // Only connect to auth emulator in development mode
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      try {
        connectAuthEmulator(auth, "http://localhost:9099");
        console.log("Connected to Firebase Auth emulator");
      } catch (emulatorError) {
        console.warn("Failed to connect to Auth emulator:", emulatorError);
      }
    }

    console.log("Firebase initialization completed successfully");
    return { app, auth };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return { app: null, auth: null };
  }
};

// Initialize Firebase on module import
try {
  const { auth: initializedAuth } = initializeFirebase();
  auth = initializedAuth;
} catch (error) {
  console.error("Firebase auto-initialization error:", error);
}

export { auth };
