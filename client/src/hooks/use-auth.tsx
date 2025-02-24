import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  User,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
            await fetch('/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'firebase-uid': user.uid
              },
              body: JSON.stringify({
                firebaseUid: user.uid,
                firstName: details.firstName,
                surname: details.surname,
                company: details.company,
                email: user.email!,
              }),
            });
            window.localStorage.removeItem('pendingUserDetails');
          } catch (error: any) {
            console.error('Error creating user profile:', error);
          }
        }
      }
      setUser(user);
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
      setUser(result.user);
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
      // Correction applied here
      await sendVerificationEmail(auth, email);

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
      // Correction applied here
      await sendVerificationEmail(auth, email);
      window.localStorage.setItem('emailForSignIn', email);
      toast({
        title: "Verification email sent",
        description: "Please check your email to complete the sign-up process",
      });
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