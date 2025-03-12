
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
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Log Firebase client config status without revealing values
console.log("Firebase Client Config Status:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Available" : "Missing",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Available" : "Missing",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "Available" : "Missing",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "Available" : "Missing",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Available" : "Missing",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? "Available" : "Missing",
});

const debugConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Present" : "Missing",
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
      const app = initializeApp(firebaseConfig);
      console.log("Firebase configuration:", {
        projectId: firebaseConfig.projectId || "not set",
        authDomain: firebaseConfig.authDomain || "not set"
      });
      console.log("Firebase initialized successfully");
      return app;
    }
    return getApps()[0];
  } catch (error) {
    console.error("Firebase initialization error:", error);
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

export const signInWithGoogle = (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
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
