import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  User,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  createUserWithEmailAndPassword,
  ActionCodeSettings
} from "firebase/auth";
import { auth, sendVerificationEmail, actionCodeSettings, handleEmailSignInLink } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SignUpData = {
  email: string;
  password: string;
  firstName: string;
  surname: string;
  company?: string;
};

// Extended user type that includes our custom fields from the database
type ExtendedUser = User & {
  isAdmin?: boolean;
  firstName?: string;
  surname?: string;
  company?: string;
};

type AuthContextType = {
  user: ExtendedUser | null;
  isLoading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
  updateUserFirebaseUid: (email: string, uid: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Function to fetch user profile data from our backend
  const fetchUserProfile = async (firebaseUser: User) => {
    try {
      console.log("Fetching profile for Firebase UID:", firebaseUser.uid);
      const response = await fetch('/api/users/profile', {
        headers: {
          'firebase-uid': firebaseUser.uid
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User profile fetched:", userData);
        // Merge Firebase user with our database user
        return {
          ...firebaseUser,
          isAdmin: userData.isAdmin || false,
          firstName: userData.firstName,
          surname: userData.surname,
          company: userData.company
        } as ExtendedUser;
      }
      console.log("No user profile found in database for UID:", firebaseUser.uid);
      return firebaseUser;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return firebaseUser;
    }
  };

  // Function to update a user's Firebase UID in the database
  const updateUserFirebaseUid = async (email: string, uid: string): Promise<boolean> => {
    try {
      console.log(`Updating Firebase UID for ${email} to ${uid}`);
      const response = await fetch('/api/users/update-firebase-uid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, firebaseUid: uid }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Firebase UID update result:", result);
        toast({
          title: "User account updated",
          description: "The Firebase UID has been successfully updated",
        });
        return true;
      } else {
        const error = await response.json();
        console.error("Error updating Firebase UID:", error);
        toast({
          title: "Update failed",
          description: error.error || "Failed to update Firebase UID",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error("Error in updateUserFirebaseUid:", error);
      toast({
        title: "Update error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    // Check if there's an email verification link
    try {
      const emailSignInResult = handleEmailSignInLink();
      if (emailSignInResult) {
        // If we're handling an email sign-in link, wait for it to complete
        setIsLoading(true);

        emailSignInResult
          .then(async (user) => {
            console.log("Email verification successful", user);
            toast({
              title: "Email Verified",
              description: "Your email has been verified. You are now signed in.",
            });
            // Fetch user profile and set it
            const extendedUser = await fetchUserProfile(user);
            setUser(extendedUser);
          })
          .catch((error) => {
            console.error("Email verification error:", error);
            toast({
              title: "Verification Failed",
              description: error.message || "Failed to verify email",
              variant: "destructive",
            });
          })
          .finally(() => setIsLoading(false));

        // Return early since we're handling the verification
        return;
      }
    } catch (error) {
      console.error("Error checking for email sign-in link:", error);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "User logged out");
      if (firebaseUser) {
        console.log("Firebase user info:", {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified
        });

        // If we have a new sign up with stored details, create the user profile
        const storedDetails = window.localStorage.getItem('pendingUserDetails');
        if (storedDetails) {
          try {
            const details = JSON.parse(storedDetails);
            await fetch('/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'firebase-uid': firebaseUser.uid
              },
              body: JSON.stringify({
                firebaseUid: firebaseUser.uid,
                firstName: details.firstName,
                surname: details.surname,
                company: details.company,
                email: firebaseUser.email!,
              }),
            });
            window.localStorage.removeItem('pendingUserDetails');
          } catch (error: any) {
            console.error('Error creating user profile:', error);
          }
        }

        // Fetch user profile data including isAdmin status
        const extendedUser = await fetchUserProfile(firebaseUser);
        setUser(extendedUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Starting login process with:", email);

      // Add detailed debug logging
      console.log("Attempting to sign in with email:", email);
      console.log("Password length:", password.length);
      console.log("Password first character:", password.charAt(0));
      console.log("Password last character:", password.charAt(password.length - 1));

      // Check if we have verified credentials from email verification
      const verifiedCredentialsJson = window.localStorage.getItem('verifiedUserCredentials');
      if (verifiedCredentialsJson) {
        try {
          const verifiedCredentials = JSON.parse(verifiedCredentialsJson);
          // If the email matches and the credentials are recent (within 5 minutes)
          const isRecent = (Date.now() - verifiedCredentials.timestamp) < 300000; // 5 minutes

          if (verifiedCredentials.email === email && isRecent) {
            console.log("Found verified credentials for this email");
            // Use the password from verified credentials instead
            password = verifiedCredentials.password;
            console.log("Using password from verified credentials");
            // Remove the stored credentials after use
            window.localStorage.removeItem('verifiedUserCredentials');
          }
        } catch (e) {
          console.error("Error parsing verified credentials:", e);
        }
      }

      // Attempt to sign in with email and password
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful for UID:", result.user.uid);

      // Fetch user profile data including isAdmin status
      const extendedUser = await fetchUserProfile(result.user);
      setUser(extendedUser);

      // Update Firebase UID in database if necessary.  This assumes the placeholder UID is in the database before login.
      if (email === 'support@trackedfr.com' && extendedUser.uid !== 'admin-support-placeholder-uid') {
        await updateUserFirebaseUid(email, result.user.uid);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // Provide more specific error messages for different authentication errors
      let errorMessage = "Failed to sign in";

      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address. Please sign up first.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later or reset your password.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error signing in",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast({
        title: "Signed out",
        description: "Successfully signed out",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const signUp = async ({ email, password, firstName, surname, company }: SignUpData) => {
    try {
      setIsLoading(true);
      console.log("Starting sign up process...");

      // Create Firebase account with email and password first
      // This ensures the password is properly stored for future login
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      console.log("Firebase account created:", firebaseUser.uid);

      // Store email in localStorage for later verification
      window.localStorage.setItem('emailForSignIn', email);

      // Create a custom actionCodeSettings with the email as a URL parameter
      const customActionCodeSettings = {
        ...actionCodeSettings,
        url: `${actionCodeSettings.url}?email=${encodeURIComponent(email)}`
      };

      // Send sign-in link to email - this is the email verification process
      await sendSignInLinkToEmail(auth, email, customActionCodeSettings);

      // Also store the password in localStorage temporarily to use after verification
      // We'll remove it after verification
      window.localStorage.setItem('tempPassword', password);

      // Store user details for later use (after verification)
      window.localStorage.setItem('pendingUserDetails', JSON.stringify({
        firstName,
        surname,
        company
      }));

      toast({
        title: "Verification Email Sent",
        description: "Please check your email to complete the sign-up process",
      });

    } catch (error: any) {
      console.error("Authentication error:", error);

      // Provide more specific error messages for different authentication errors
      let errorMessage = "Failed to create account";

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use. Please try signing in instead.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address provided is invalid. Please enter a valid email.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Account creation is currently disabled. Please try again later.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error creating account",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailVerification = async (email: string) => {
    try {
      // Send verification email to the user
      if (auth.currentUser) {
        await sendVerificationEmail(auth.currentUser);
        window.localStorage.setItem('emailForSignIn', email);
        toast({
          title: "Verification email sent",
          description: "Please check your email to complete the sign-up process",
        });
      } else {
        throw new Error("No authenticated user found");
      }
    } catch (error: any) {
      console.error("Email verification error:", error);
      toast({
        title: "Error sending verification",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signUp,
        login,
        logout,
        sendEmailVerification,
        updateUserFirebaseUid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}