import { initializeApp } from "firebase/app";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

// Debug environment variables
console.log("Firebase Config Debug:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Present" : "Missing",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Present" : "Missing",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Present" : "Missing"
});

// Get the full domain for configuration
const currentDomain = window.location.hostname;
console.log("Current domain:", currentDomain);

// Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Add authorized domains for Firebase Auth
const authorizedDomains = [
  'trackedfr.com',
  'www.trackedfr.com',
  currentDomain
];

// Log configuration for debugging
console.log("Firebase configuration:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  authorizedDomains
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized successfully");

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Email verification link configuration
export const actionCodeSettings = {
  url: `${window.location.origin}/auth?email=${encodeURIComponent(window.location.search)}`,
  handleCodeInApp: true,
  dynamicLinkDomain: 'trackedfr.com'
};

// Function to send email verification link
export async function sendVerificationEmail(email: string) {
  return sendSignInLinkToEmail(auth, email, actionCodeSettings);
}