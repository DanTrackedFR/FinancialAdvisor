
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Get current domain to help with configuration
const currentDomain = window.location.host;
console.log("Current domain:", currentDomain);

let app;
let auth;

export const initializeFirebase = () => {
  try {
    // Avoid duplicate Firebase initialization
    try {
      // Check if Firebase is already initialized
      app = initializeApp(firebaseConfig);
    } catch (error) {
      // @ts-ignore
      if (error.code === 'app/duplicate-app') {
        console.log("Firebase already initialized, getting existing app");
        app = initializeApp();
      } else {
        throw error;
      }
    }
    
    auth = getAuth(app);

    // Only connect to auth emulator in development mode
    if (import.meta.env.DEV || window.location.hostname === 'localhost') {
      connectAuthEmulator(auth, "http://localhost:9099");
    }

    console.log("Firebase configuration:", {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
    });

    console.log("Firebase initialized successfully");
    return { app, auth };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return { app: null, auth: null };
  }
};

// Initialize Firebase on module import
try {
  initializeFirebase();
} catch (error) {
  console.error("Firebase auto-initialization error:", error);
}

export { auth };
