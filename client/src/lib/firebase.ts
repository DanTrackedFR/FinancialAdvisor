import { initializeApp } from "firebase/app";
import { getAuth, sendSignInLinkToEmail, User } from "firebase/auth";

const currentDomain = window.location.hostname;
const isProduction = import.meta.env.PROD;

// Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Email verification link configuration
export const actionCodeSettings = {
  // Use current domain in development, trackedfr.com in production
  url: isProduction 
    ? `https://trackedfr.com/auth${window.location.search}`
    : `${window.location.protocol}//${currentDomain}/auth${window.location.search}`,
  handleCodeInApp: true,
  // Only set dynamicLinkDomain in production
  ...(isProduction && { dynamicLinkDomain: 'trackedfr.com' })
};

// Function to send email verification link - updated to accept User object
export async function sendVerificationEmail(user: User) {
  try {
    if (!user.email) {
      throw new Error("User email is missing");
    }
    await sendSignInLinkToEmail(auth, user.email, actionCodeSettings);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}