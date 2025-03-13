
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { type UserCredential } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, // Direct use of the full domain name
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Log Firebase client config status without revealing values
console.log("Firebase Client Config Status:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Available" : "Missing",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "Available" : "Missing",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Available" : "Missing",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "Available" : "Missing",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "Available" : "Missing",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Available" : "Missing",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? "Available" : "Missing",
});

const debugConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Present" : "Missing",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "Present" : "Missing",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Present" : "Missing",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Present" : "Missing",
};
console.log("Firebase Config Debug:", debugConfig);

// Check domain for debugging
console.log("Current domain:", window.location.hostname);

// Helper function to initialize Firebase
export function initializeFirebase() {
  try {
    if (!getApps().length) {
      // Log complete configuration details for debugging
      console.log("Firebase configuration details:");
      console.log("- Project ID:", firebaseConfig.projectId || "not set");
      console.log("- Auth Domain:", firebaseConfig.authDomain || "not set");
      console.log("- Storage Bucket:", firebaseConfig.storageBucket || "not set");
      console.log("- Current Hostname:", window.location.hostname);
      
      // Check for firebase configuration issues
      if (!firebaseConfig.apiKey) {
        console.error("Firebase API Key is missing");
      }
      
      if (!firebaseConfig.authDomain) {
        console.error("Firebase Auth Domain is missing");
      }
      
      if (!firebaseConfig.projectId) {
        console.error("Firebase Project ID is missing");
      }
      
      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      console.log("Firebase initialized successfully");
      return app;
    }
    return getApps()[0];
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Log specific details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    // Return undefined instead of null to satisfy TypeScript
    return undefined;
  }
}

// Initialize firebase on import
const firebaseApp = initializeFirebase();

// Create auth instance
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signIn = (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const register = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return userCredential;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const logOut = (): Promise<void> => {
  return signOut(auth);
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    console.log("Starting Google sign-in process...");
    console.log("Current auth domain:", firebaseConfig.authDomain);
    
    // Add additional scopes if needed
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    // Set custom parameters
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign-in successful");
    return result;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Better error handling for specific Google sign-in issues
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("User closed the sign-in popup");
      throw new Error("Sign-in was canceled. Please try again.");
    } else if (error.code === 'auth/unauthorized-domain') {
      console.error("Unauthorized domain for authentication");
      console.error("Current domain:", window.location.hostname);
      throw new Error("Authentication error: This domain is not authorized for sign-in. Please ensure it's added to Firebase authorized domains.");
    } else if (error.code === 'auth/internal-error') {
      console.error("Internal Firebase authentication error");
      throw new Error("Internal authentication error. Please try again later.");
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.log("Popup request was cancelled");
      throw new Error("Sign-in request was cancelled. Please try again.");
    } else if (error.code === 'auth/popup-blocked') {
      console.error("Pop-up was blocked by the browser");
      throw new Error("Sign-in popup was blocked. Please enable popups for this site and try again.");
    }
    
    // Generic error
    throw error;
  }
};

export const sendPasswordReset = (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

// Default export with all auth functions
export default {
  auth,
  googleProvider,
  initializeFirebase,
  signIn,
  register,
  logOut,
  signInWithGoogle,
  sendPasswordReset
};
