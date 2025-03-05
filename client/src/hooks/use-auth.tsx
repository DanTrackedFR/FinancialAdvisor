import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification as firebaseSendEmailVerification,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail
} from "firebase/auth";
import { useToast } from "./use-toast";
import { auth, signIn, register as firebaseRegister, logOut, signInWithGoogle as firebaseSignInWithGoogle } from "@/lib/firebase-client";


// Define the authentication context type
interface AuthContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  signUp: (userData: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  sendVerificationEmail: (user: FirebaseUser) => Promise<void>;
  verifyEmail: (email: string) => Promise<FirebaseUser>;
}

// Define the sign-up data type
interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  surname: string;
  company?: string;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Email verification link configuration
const actionCodeSettings = {
  url: `${window.location.origin}/verify-email`,
  handleCodeInApp: true,
};

// Provider component to wrap the application
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Function to synchronize the user with the backend
  const syncUserWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          firebaseUser: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            emailVerified: firebaseUser.emailVerified,
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to synchronize user with backend");
      }

      return await response.json();
    } catch (error) {
      console.error("Error syncing user with backend:", error);
      throw error;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const app = initializeFirebase();
    if (!app) {
      console.error("Failed to initialize Firebase");
      setIsLoading(false);
      return () => {}; // Return empty cleanup function
    }

    const auth = getAuth(app);
    if (!auth) {
      console.error("Failed to get auth instance");
      setIsLoading(false);
      return () => {}; // Return empty cleanup function
    }

    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "User logged out");
    }, (error) => {
      console.error("Auth state change error:", error);
      setIsLoading(false);
    });

    // Check for email link sign-in
    if (auth && isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again. For example:
        email = window.prompt('Please provide your email for confirmation');
      }

      if (email) {
        setIsLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            setUser(result.user);
          })
          .catch((error) => {
            console.error("Error signing in with email link:", error);
            toast({
              title: "Error signing in",
              description: error.message,
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.error("Error unsubscribing from auth state:", e);
      }
    };
  }, [toast]);

  // Log in a user with email and password
  const login = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please check your email to verify your account before logging in.",
          variant: "destructive",
        });
        await firebaseSignOut(auth);
        throw new Error("Email not verified");
      }

      await syncUserWithBackend(userCredential.user);

      return userCredential.user;
    } catch (error: any) {
      console.error("Login error:", error);

      const errorMessage = 
        error.code === "auth/user-not-found" || error.code === "auth/wrong-password" 
          ? "Invalid email or password"
          : error.code === "auth/too-many-requests"
          ? "Too many failed login attempts. Please try again later."
          : "Failed to sign in. Please try again.";

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up a new user
  const signUp = async (userData: SignUpData): Promise<void> => {
    try {
      setIsLoading(true);

      // Create the user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Update the user's profile
      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.surname}`,
      });

      // Send email verification
      await sendEmailVerification(userCredential.user, actionCodeSettings);

      // Store email for verification process
      localStorage.setItem("emailForSignIn", userData.email);

      // Store data for after verification process
      localStorage.setItem('verifiedUserCredentials', JSON.stringify({
        email: userData.email,
        timestamp: Date.now()
      }));

      // Log the user out - they need to verify email first
      await firebaseSignOut(auth);
      setUser(null);

      toast({
        title: "Verification Email Sent",
        description: "Please check your email to complete the sign-up process",
      });
    } catch (error: any) {
      console.error("Signup error:", error);

      const errorMessage = 
        error.code === "auth/email-already-in-use"
          ? "Email is already in use"
          : "Failed to create account. Please try again.";

      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      await syncUserWithBackend(userCredential.user);

      return userCredential.user;
    } catch (error: any) {
      console.error("Google sign-in error:", error);

      // Don't show error for user cancellation
      if (error.code !== "auth/popup-closed-by-user") {
        toast({
          title: "Sign In Failed",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Send verification email
  const sendVerificationEmail = async (user: FirebaseUser): Promise<void> => {
    try {
      await sendEmailVerification(user, actionCodeSettings);
      localStorage.setItem("emailForSignIn", user.email || "");

      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      console.error("Send verification email error:", error);
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Verify email with link
  const verifyEmail = async (email: string): Promise<FirebaseUser> => {
    try {
      setIsLoading(true);

      if (!isSignInWithEmailLink(auth, window.location.href)) {
        throw new Error("Invalid verification link");
      }

      const userCredential = await signInWithEmailLink(auth, email, window.location.href);

      await syncUserWithBackend(userCredential.user);

      return userCredential.user;
    } catch (error) {
      console.error("Email verification error:", error);
      toast({
        title: "Verification Failed",
        description: "There was an error verifying your email. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Log out the user
  const logout = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // The authentication context value
  const value = {
    user,
    isLoading,
    login,
    signUp,
    logout,
    signInWithGoogle,
    sendVerificationEmail,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use the authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}