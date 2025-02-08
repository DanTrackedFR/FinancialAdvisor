import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  AuthError,
  GoogleAuthProvider
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
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

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Sign-in successful:", {
        email: result.user.email,
        displayName: result.user.displayName
      });

      setUser(result.user);
      toast({
        title: "Welcome!",
        description: `Successfully signed in as ${result.user.displayName}`,
      });
    } catch (error) {
      console.error("Authentication error:", error);
      const authError = error as AuthError;

      let errorMessage = "Failed to sign in with Google";
      if (authError.code === 'auth/unauthorized-domain') {
        errorMessage = `This domain is not authorized for Google sign-in. Please ensure it's added to Firebase console.`;
      }

      toast({
        title: "Error signing in",
        description: errorMessage,
        variant: "destructive",
      });
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
      console.error("Sign out error:", authError);
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
        signInWithGoogle,
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