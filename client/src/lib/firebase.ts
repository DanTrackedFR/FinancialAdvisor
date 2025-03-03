import { initializeApp } from "firebase/app";
import { getAuth, sendSignInLinkToEmail, User, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

const currentDomain = window.location.host; // Changed from hostname to host to include port number
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
  // URL you want to redirect back to after email verification
  // Use current domain to ensure it works in all environments
  url: `${window.location.protocol}//${currentDomain}/verify-email`,
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
    window.localStorage.setItem('emailForSignIn', user.email); // Store email for later retrieval
    await sendSignInLinkToEmail(auth, user.email, actionCodeSettings);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

// Function to handle email sign-in links
export function handleEmailSignInLink() {
  // Check if the URL contains an email sign-in link
  if (isSignInWithEmailLink(auth, window.location.href)) {
    console.log("Detected sign-in with email link");

    // Get the email from localStorage (we stored it when sending the link)
    let email = window.localStorage.getItem('emailForSignIn');

    if (!email) {
      // If email is not in localStorage, prompt the user for it
      email = window.prompt('Please provide your email for confirmation');
    }

    if (email) {
      // Sign in the user with the email link
      return signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
          // Clear the email from localStorage
          window.localStorage.removeItem('emailForSignIn');
          return result.user;
        })
        .catch((error) => {
          console.error("Error signing in with email link:", error);
          throw error;
        });
    } else {
      throw new Error("Email is required to complete sign-in");
    }
  }

  // If not a sign-in link, return null
  return null;
}
