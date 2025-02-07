import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Debug environment variables
console.log("Firebase Config Debug:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Present" : "Missing",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Present" : "Missing",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Present" : "Missing"
});

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyB3yq9_qhonCpquQ5WuTqocM0nwY_pytW4",
  authDomain: "trackedfr.firebaseapp.com",
  projectId: "trackedfr",
  storageBucket: "trackedfr.appspot.com",
  messagingSenderId: "857363648999",
  appId: "1:857363648999:web:ec2fe37eeab2258defed42"
};

// Log the full config for debugging (excluding sensitive values)
console.log("Firebase Config Structure:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? "Set" : "Missing",
  appId: firebaseConfig.appId ? "Set" : "Missing",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized successfully");

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Add minimal required scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Force account selection
googleProvider.setCustomParameters({
  prompt: 'select_account'
});