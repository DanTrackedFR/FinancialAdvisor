import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Debug environment variables
console.log("Firebase Config Debug:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Present" : "Missing",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Present" : "Missing",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Present" : "Missing"
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "workspace.danhastings33.repl.co",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log the full config for debugging (excluding sensitive values)
console.log("Firebase Config Structure:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? "Set" : "Missing",
  appId: firebaseConfig.appId ? "Set" : "Missing",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
  export const auth = getAuth(app);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Add minimal required scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Force account selection
googleProvider.setCustomParameters({
  prompt: 'select_account'
});