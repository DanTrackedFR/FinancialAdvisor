import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// This is safe to expose in client-side code
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug logging for development
console.log("Firebase Config Debug:", {
  apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
  projectId: firebaseConfig.projectId ? "Present" : "Missing",
  appId: firebaseConfig.appId ? "Present" : "Missing"
});

// Get current domain for auth redirects
const currentDomain = window.location.hostname;
console.log("Current domain:", currentDomain);

// Function to initialize Firebase
export function initializeFirebase() {
  try {
    // Initialize Firebase if not already initialized
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Set persistence and other configurations as needed
    console.log("Firebase configuration:", {
      projectId: app.options.projectId,
      authDomain: app.options.authDomain
    });

    console.log("Firebase initialized successfully");
    return { app, auth };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

// Initialize Firebase and export auth and google provider
const googleProvider = new GoogleAuthProvider();
export const { auth } = initializeFirebase();
export { googleProvider };