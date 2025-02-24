import { initializeApp } from "firebase/app";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

// Use the current domain for dynamic configuration
const currentDomain = window.location.hostname;
const currentOrigin = window.location.origin;

// Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Add authorized domains for Firebase Auth - include both production and development domains
const authorizedDomains = [
  'trackedfr.com',
  'www.trackedfr.com',
  currentDomain,
  `${currentDomain}.repl.co`, // Add Replit domain
];

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Email verification link configuration that works in both development and production
export const actionCodeSettings = {
  url: `${currentOrigin}/auth${window.location.search}`,
  handleCodeInApp: true,
  // Only set dynamicLinkDomain for production domain
  ...(currentDomain.includes('trackedfr.com') && { dynamicLinkDomain: 'trackedfr.com' })
};

// Function to send email verification link with error handling
export async function sendVerificationEmail(email: string) {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Store the email in localStorage for later use
    window.localStorage.setItem('emailForSignIn', email);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send verification email'
    };
  }
}