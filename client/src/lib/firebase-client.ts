import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  User,
  UserCredential,
} from "firebase/auth";
import firebaseConfig from "./firebaseConfig";

// Log Firebase configuration for debugging (without exposing sensitive values)
const debugConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ? "Present" : "Missing",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ? "Present" : "Missing",
  appId: process.env.VITE_FIREBASE_APP_ID ? "Present" : "Missing",
};
console.log("Firebase Config Debug:", debugConfig);

// Check domain for debugging
console.log("Current domain:", window.location.hostname);

// Helper function to initialize Firebase
export const initializeFirebase = () => {
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
    throw error;
  }
};

// Initialize firebase on import
try {
  const app = initializeFirebase();
  if(!app){
    console.error("Failed to initialize Firebase. Application cannot continue.");
    throw new Error("Firebase Initialization Failed");
  }
  // Export the auth for use throughout the app
  export const auth = getAuth(app);

  // Handle Google authentication
  const googleProvider = new GoogleAuthProvider();

  // Export authentication functions
  export const signIn = (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  export const register = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send verification email
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

  export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Auth state changed:", "User logged in");
      } else {
        console.log("Auth state changed:", "User logged out");
      }
      callback(user);
    });
  };
  export default {
    initializeFirebase,
    getApps,
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    signIn,
    register,
    logOut,
    signInWithGoogle,
    onAuthChange,
    auth,
  };

} catch (error) {
  console.error("Could not initialize Firebase:", error);
}