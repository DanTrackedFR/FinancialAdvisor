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
      console.log("Starting Google sign-in process...");
      // Clear any existing auth state
      await signOut(auth);

      // Attempt sign in
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential) {
        throw new Error("Failed to get credentials from Google");
      }

      console.log("Sign-in successful:", {
        email: result.user.email,
        displayName: result.user.displayName,
        providerId: credential.providerId
      });

      setUser(result.user);
      toast({
        title: "Welcome!",
        description: `Successfully signed in as ${result.user.displayName}`,
      });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Authentication error details:", {
        code: authError.code,
        message: authError.message,
        customData: authError.customData,
      });

      let errorMessage = "Failed to sign in with Google";

      // More specific error messages based on common error codes
      switch (authError.code) {
        case 'auth/popup-blocked':
          errorMessage = "Please allow popups for this website to sign in with Google";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "Sign-in cancelled. Please try again";
          break;
        case 'auth/unauthorized-domain':
          errorMessage = "This domain is not authorized for Google sign-in. Please contact support";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Google sign-in is not enabled. Please contact support";
          break;
        case 'auth/invalid-api-key':
          errorMessage = "Invalid API configuration. Please contact support";
          break;
        case 'auth/invalid-action-code':
          errorMessage = "The sign-in link is invalid or has expired. Please try again";
          break;
        case 'auth/internal-error':
          errorMessage = "An internal error occurred. Please try again later";
          break;
        default:
          console.error("Unhandled auth error:", authError);
          errorMessage = `Authentication error: ${authError.message}`;
      }

      toast({
        title: "Error signing in",
        description: errorMessage,
        variant: "destructive",
      });
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