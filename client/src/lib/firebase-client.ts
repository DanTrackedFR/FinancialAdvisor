import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { type UserCredential } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

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
    return null;
  }
}

// Initialize firebase on import
let firebaseApp;
try {
  firebaseApp = initializeFirebase();
  if(!firebaseApp){
    console.error("Failed to initialize Firebase. Application cannot continue.");
    throw new Error("Firebase Initialization Failed");
  }
} catch (error) {
  console.error("Fatal Firebase initialization error:", error);
}

// Export the auth for use throughout the app
export const auth = getAuth(firebaseApp);

// Handle Google authentication
const googleProvider = new GoogleAuthProvider();

// Export authentication functions
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

export const signInWithGoogle = (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
};