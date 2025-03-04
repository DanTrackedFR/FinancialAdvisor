
import { initializeApp } from "firebase/app";
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
const currentDomain = window.location.host;
console.log("Current domain:", currentDomain);

// Initialize Firebase
let app;
let auth;

export const initializeFirebase = () => {
  try {
    // Only initialize once
    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized");
    }
    
    if (!auth) {
      auth = getAuth(app);
      console.log("Firebase auth initialized");
    }

    // Only connect to auth emulator in development
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      try {
        connectAuthEmulator(auth, "http://localhost:9099");
        console.log("Connected to Firebase Auth emulator");
      } catch (emulatorError) {
        console.warn("Failed to connect to Auth emulator:", emulatorError);
      }
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

// Initialize Firebase on module import
try {
  const { auth: initializedAuth } = initializeFirebase();
  auth = initializedAuth;
} catch (error) {
  console.error("Firebase auto-initialization error:", error);
}

export { auth };
