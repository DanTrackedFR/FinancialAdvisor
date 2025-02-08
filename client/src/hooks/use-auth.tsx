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
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async ({ email, password, firstName, surname, company }: SignUpData) => {
    try {
      setIsLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update the user's profile with additional information
      await updateProfile(result.user, {
        displayName: `${firstName} ${surname}`,
        // Store company in photoURL field as a workaround since Firebase doesn't have a dedicated field for it
        photoURL: company || null,
      });

      setUser(result.user);
      toast({
        title: "Account created",
        description: "Successfully created your account",
      });
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = "Failed to create account";

      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists";
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters";
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
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = "Failed to sign in";

      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password";
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