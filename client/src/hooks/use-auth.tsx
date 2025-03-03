import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  User,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  ActionCodeSettings
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
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Function to fetch user profile data from our backend
  const fetchUserProfile = async (firebaseUser: User) => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'firebase-uid': firebaseUser.uid
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Merge Firebase user with our database user
        return {
          ...firebaseUser,
          isAdmin: userData.isAdmin || false,
          firstName: userData.firstName,
          surname: userData.surname,
          company: userData.company
        } as ExtendedUser;
      }
      return firebaseUser;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return firebaseUser;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "User logged out");
      if (firebaseUser) {
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
      console.log("Starting login process...");
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful");

      // Fetch user profile data including isAdmin status
      const extendedUser = await fetchUserProfile(result.user);
      setUser(extendedUser);

      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error signing in",
        description: error.message || "Failed to sign in",
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
      //Incomplete change - needs proper actionCodeSettings and email link handling
      const actionCodeSettings = {
        url: 'http://localhost:3000/verify-email', //Update with your URL
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      window.localStorage.setItem('pendingUserDetails', JSON.stringify({
        firstName,
        surname,
        company
      }));

    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Error creating account",
        description: error.message || "Failed to create account",
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