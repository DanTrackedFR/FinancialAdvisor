import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB3yq9_qhonCpquQ5WuTqocM0nwY_pytW4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "trackedfr.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trackedfr",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "trackedfr.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "857363648999",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:857363648999:web:ec2fe37eeab2258defed42",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-J7HZ5SGPN2"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();