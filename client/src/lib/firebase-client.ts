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

// Log Firebase configuration for debugging (without exposing sensitive values)
const debugConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ? "Present" : "Missing",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ? "Present" : "Missing",
  appId: process.env.VITE_FIREBASE_APP_ID ? "Present" : "Missing",
};
console.log("Firebase Config Debug:", debugConfig);

// Check domain for debugging
console.log("Current domain:", window.location.hostname);

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Log configuration for debugging (without sensitive values)
console.log("Firebase configuration:", {
  projectId: firebaseConfig.appId,
  authDomain: firebaseConfig.authDomain,
});

// Initialize Firebase function to prevent duplicate initializations
export function initializeFirebase(): FirebaseApp | null {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const appId = process.env.VITE_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !appId) {
    console.error('Firebase configuration variables missing');
    return null;
  }

  const authDomain = `${projectId}.firebaseapp.com`;

  console.log("Current domain:", window.location.hostname);

  // Debug Firebase config - without showing sensitive values
  console.log("Firebase Config Debug:", {
    apiKey: apiKey ? "Present" : "Missing",
    projectId: projectId ? "Present" : "Missing",
    appId: appId ? "Present" : "Missing"
  });

  try {
    // Check if Firebase is already initialized
    const apps = getApps();
    if (apps.length > 0) {
      console.log("Firebase already initialized, returning existing app");
      return apps[0];
    }

    const config = {
      apiKey,
      authDomain,
      projectId,
      appId
    };

    console.log("Firebase configuration:", { projectId, authDomain });
    const app = initializeApp(config);
    console.log("Firebase initialized successfully");
    return app;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return null;
  }
}

// Initialize app - handle potential null return from initializeFirebase
const app = initializeFirebase();
if (!app) {
  console.error("Failed to initialize Firebase.  Application cannot continue.");
  throw new Error("Firebase Initialization Failed");
}

// Export the auth for use throughout the app
export const auth = getAuth(app);

// Set persistence to local (browser session) to improve user experience
// setPersistence(auth, browserLocalPersistence)
//   .catch((error) => {
//     console.error("Error setting persistence:", error);
//   });

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
  signIn,
  register,
  logOut,
  signInWithGoogle,
  onAuthChange,
  auth,
};