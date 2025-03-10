import { User as FirebaseUser } from 'firebase/auth';

// Extend the Firebase User type
declare module 'firebase/auth' {
  interface User {
    isAdmin?: boolean;
  }
}

// Extend for custom properties from our backend
declare global {
  interface BackendUser {
    id: number;
    firebaseUid: string;
    firstName: string;
    surname: string;
    company: string | null;
    email: string;
    lastLoggedIn: Date | null;
    createdAt: Date;
    stripeCustomerId: string | null;
    subscriptionStatus: "trial" | "active" | "cancelled" | "expired";
    subscriptionEndsAt: Date | null;
    trialEndsAt: Date | null;
    isAdmin: boolean;
  }
}