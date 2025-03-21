import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification as firebaseSendEmailVerification,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { useToast } from "./use-toast";
import { auth, signIn, register as firebaseRegister, logOut, signInWithGoogle as firebaseSignInWithGoogle, sendPasswordReset } from "@/lib/firebase-client";


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
  resetPassword: (email: string) => Promise<void>;
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
      // Force token refresh to ensure we have the most recent token (important after domain changes)
      await firebaseUser.getIdToken(true); 
      const idToken = await firebaseUser.getIdToken();
      
      console.log("Syncing user with backend (domain: " + window.location.hostname + ")");
      
      // When using custom domains, include both authorization methods for better compatibility
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
          "firebase-uid": firebaseUser.uid // Add UID header as fallback
        },
        body: JSON.stringify({
          firebaseUser: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            emailVerified: firebaseUser.emailVerified,
            // Add company property if it exists in localStorage
            ...(localStorage.getItem('userCompany') && { 
              company: localStorage.getItem('userCompany') 
            })
          }
        })
      });

      if (!response.ok) {
        console.error("Backend sync failed:", response.status, response.statusText);
        throw new Error("Failed to synchronize user with backend");
      }

      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        
        // Set the isAdmin property on the Firebase user if available in the backend response
        if (data.user && typeof data.user.isAdmin === 'boolean') {
          // This extends the Firebase user object with our custom property
          firebaseUser.isAdmin = data.user.isAdmin;
          console.log("Admin status set on user:", data.user.isAdmin);
        }
        
        return data;
      } else {
        console.error("Non-JSON response received:", contentType);
        // If we received HTML instead of JSON, return a default response
        return { success: true };
      }
    } catch (error) {
      console.error("Error syncing user with backend:", error);
      // Return a default successful response rather than throwing
      // This prevents login failures due to backend synchronization issues
      return { success: true };
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "User logged out");
      
      // If user is logged in but email is not verified, log them out immediately
      if (firebaseUser && !firebaseUser.emailVerified) {
        // Only set the user temporarily to trigger the handleUnverifiedUser function
        setUser(firebaseUser);
        // We'll handle the logout in a separate function to avoid race conditions
      } else if (firebaseUser) {
        // For logged in users with verified emails, sync with backend to get admin status
        try {
          // This will update the user's isAdmin property
          await syncUserWithBackend(firebaseUser);
          setUser(firebaseUser);
        } catch (error) {
          console.error("Error syncing user on auth state change:", error);
          // Still set the user to maintain login state even if sync fails
          setUser(firebaseUser);
        }
      } else {
        // For logged out users
        setUser(null);
      }
      
      setIsLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setIsLoading(false);
    });
    
    // Handle unverified user with a separate effect to avoid race conditions
    const handleUnverifiedUser = async () => {
      if (user && !user.emailVerified) {
        // Check if this is from a new sign-up (we'll redirect to login page)
        const justSignedUp = localStorage.getItem('justSignedUp') === 'true';
        
        // Log them out since email is not verified
        await logOut();
        setUser(null);
        
        // If they just signed up, direct them to auth page instead of home
        if (justSignedUp) {
          // Clear the flag
          localStorage.removeItem('justSignedUp');
          window.location.href = '/auth?mode=login';
        }
      }
    };
    
    if (user) {
      handleUnverifiedUser();
    }

    // Check for email link sign-in
    if (auth && isSignInWithEmailLink(auth, window.location.href)) {
      // Default to empty string if null to avoid TypeScript errors
      let email = window.localStorage.getItem('emailForSignIn') || '';
      
      if (email === '') {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again
        const promptedEmail = window.prompt('Please provide your email for confirmation');
        // If user cancels the prompt, promptedEmail will be null
        email = promptedEmail || '';
      }

      // Only proceed if we have an email
      if (email !== '') {
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
  }, [user, toast]); // Add user and toast as dependencies

  // Log in a user with email and password
  const login = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      setIsLoading(true);
      const userCredential = await signIn(email, password);

      if (!userCredential.user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please check your email to verify your account before logging in.",
          variant: "destructive",
        });
        await logOut();
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

      // Set a flag to indicate this is a new sign-up
      // This will help us redirect to login page instead of home page
      localStorage.setItem("justSignedUp", "true");

      // Create the user in Firebase
      const userCredential = await firebaseRegister(userData.email, userData.password);

      // Update the user's profile
      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.surname}`,
      });

      // Send verification email
      await sendEmailVerification(userCredential.user, actionCodeSettings);

      // Store email for verification process
      localStorage.setItem("emailForSignIn", userData.email);

      // Store company information for after verification process
      if (userData.company) {
        localStorage.setItem("userCompany", userData.company);
      }

      // Store data for after verification process
      localStorage.setItem('verifiedUserCredentials', JSON.stringify({
        email: userData.email,
        firstName: userData.firstName,
        surname: userData.surname,
        company: userData.company || "",
        timestamp: Date.now()
      }));

      // Check if we're in the signup process (dialog is already showing)
      const inSignupProcess = localStorage.getItem("signupInProgress") === "true";
      
      // Log the user out - they need to verify email first
      await logOut();
      setUser(null);
      
      // Only redirect if we're not already showing the verification dialog
      // This prevents the momentary flash of the home page
      if (!inSignupProcess) {
        // Redirect to login page to avoid flashing of home page
        window.location.href = '/auth?mode=login';
        
        // Only remove the flag if we're redirecting
        // Otherwise keep it so the dialog can be shown
        localStorage.removeItem("signupInProgress");
      }
      
      // DO NOT remove the signupInProgress flag here 
      // It will be removed when the verification dialog is closed

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

      // Clear all flags
      localStorage.removeItem("justSignedUp");
      localStorage.removeItem("signupInProgress");

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    try {
      setIsLoading(true);
      const userCredential = await firebaseSignInWithGoogle();
      
      await syncUserWithBackend(userCredential.user);
      
      return userCredential.user;
    } catch (error: any) {
      console.error("Google sign-in error:", error);

      // Provide more specific error messages based on the error code
      if (error.code === "auth/popup-closed-by-user") {
        // User closed the popup, don't show error toast
        console.log("User closed the Google sign-in popup");
      } else if (error.code === "auth/unauthorized-domain") {
        toast({
          title: "Domain Error",
          description: "This domain is not authorized for authentication. Please contact support.",
          variant: "destructive",
        });
      } else if (error.code === "auth/internal-error") {
        toast({
          title: "Authentication Error",
          description: "There was a problem with Google authentication. Please try again later.",
          variant: "destructive",
        });
      } else {
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
      await firebaseSendEmailVerification(user, actionCodeSettings);
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
      
      // Get stored user credentials if available
      const storedCredentialsJson = localStorage.getItem('verifiedUserCredentials');
      if (storedCredentialsJson) {
        try {
          const storedCredentials = JSON.parse(storedCredentialsJson);
          // Check if the stored company matches the email being verified
          if (storedCredentials.email === email && storedCredentials.company) {
            // Store company for future logins
            localStorage.setItem('userCompany', storedCredentials.company);
          }
        } catch (e) {
          console.error("Error parsing stored credentials:", e);
        }
      }

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
      await logOut();
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
  
  // Reset password for a user
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      await sendPasswordReset(email);
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email to reset your password. Don't forget to check your spam folder if you don't see it in your inbox.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      // Provide user-friendly error messages
      const errorMessage = 
        error.code === "auth/user-not-found" 
          ? "No account found with this email address."
          : error.code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : "Failed to send password reset email. Please try again.";
      
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
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
    resetPassword,
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