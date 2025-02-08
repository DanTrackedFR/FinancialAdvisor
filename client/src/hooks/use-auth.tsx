import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  User,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  AuthError
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "User logged out");
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async ({ email, password, firstName, surname, company }: SignUpData) => {
    try {
      setIsLoading(true);
      console.log("Starting sign up process...");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created successfully, updating profile...");

      // Update the user's profile with additional information
      await updateProfile(result.user, {
        displayName: `${firstName} ${surname}`,
        photoURL: company || null,
      });
      console.log("Profile updated successfully");

      setUser(result.user);
      toast({
        title: "Account created",
        description: "Successfully created your account",
      });
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