import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  User,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  AuthError,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import { auth, sendVerificationEmail } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SignUpData = {
  email: string;
  password: string;
  firstName: string;
  surname: string;
  company?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "User logged out");
      if (user) {
        // If we have a new sign up with stored details, create the user profile
        const storedDetails = window.localStorage.getItem('pendingUserDetails');
        if (storedDetails) {
          try {
            const details = JSON.parse(storedDetails);
            await apiRequest('POST', '/api/users', {
              firebaseUid: user.uid,
              firstName: details.firstName,
              surname: details.surname,
              company: details.company,
              email: user.email!,
            });
            window.localStorage.removeItem('pendingUserDetails');
          } catch (error) {
            console.error('Error creating user profile:', error);
          }
        }
      }
      setUser(user);
      setIsLoading(false);
    });

    // Check for email link sign-in
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }

      if (email) {
        setIsLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            setUser(result.user);
            toast({
              title: "Email verified",
              description: "Your email has been verified successfully",
            });
          })
          .catch((error) => {
            toast({
              title: "Verification failed",
              description: error.message,
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }

    return () => unsubscribe();
  }, [toast]);

  const sendEmailVerification = async (email: string) => {
    try {
      await sendVerificationEmail(email);
      window.localStorage.setItem('emailForSignIn', email);
      toast({
        title: "Verification email sent",
        description: "Please check your email to complete the sign-up process",
      });
    } catch (error) {
      console.error("Email verification error:", error);
      const authError = error as AuthError;
      toast({
        title: "Error sending verification",
        description: authError.message || "Failed to send verification email",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async ({ email, password, firstName, surname, company }: SignUpData) => {
    try {
      setIsLoading(true);
      console.log("Starting sign up process...");
      // First send verification email
      await sendEmailVerification(email);

      // Store user details for later
      window.localStorage.setItem('pendingUserDetails', JSON.stringify({
        firstName,
        surname,
        company
      }));

    } catch (error) {
      console.error("Authentication error:", error);
      const authError = error as AuthError;
      let errorMessage = "Failed to create account";

      switch (authError.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address format";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled. Please contact support.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your internet connection.";
          break;
        default:
          errorMessage = `Registration failed: ${authError.message}`;
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

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Starting login process...");
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful");
      setUser(result.user);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });
    } catch (error) {
      console.error("Login error:", error);
      const authError = error as AuthError;
      let errorMessage = "Failed to sign in";

      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = "Invalid email or password";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your internet connection.";
          break;
        default:
          errorMessage = `Login failed: ${authError.message}`;
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
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Error signing out",
        description: authError.message || "Failed to sign out",
        variant: "destructive",
      });
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