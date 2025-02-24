import { initializeApp } from "firebase/app";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

const currentDomain = window.location.hostname;

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Email verification link configuration for custom domain
export const actionCodeSettings = {
  url: `https://trackedfr.com/auth?email=${encodeURIComponent(window.location.search)}`,
  handleCodeInApp: true,
  dynamicLinkDomain: 'trackedfr.com'
};

// Function to send email verification link
export async function sendVerificationEmail(email: string) {
  return sendSignInLinkToEmail(auth, email, actionCodeSettings);
}