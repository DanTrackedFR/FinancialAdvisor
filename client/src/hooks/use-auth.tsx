import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  AuthError,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
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
    // Check for redirect result on component mount
    getRedirectResult(auth).then((result) => {
      if (result) {
        handleSuccessfulSignIn(result);
      }
    }).catch((error) => {
      console.error("Redirect sign-in error:", error);
      handleAuthError(error);
    });

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
      // Always use redirect for consistency across devices
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulSignIn = (result: any) => {
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
  };

  const handleAuthError = (error: AuthError) => {
    console.error("Authentication error:", error);

    let errorMessage = "Failed to sign in with Google";
    switch (error.code) {
      case 'auth/popup-blocked':
      case 'auth/cancelled-popup-request':
        errorMessage = "Sign-in was cancelled. Please try again";
        break;
      case 'auth/unauthorized-domain':
        errorMessage = `This domain is not authorized for Google sign-in. Please ensure it's added to Firebase console.`;
        break;
      case 'auth/operation-not-allowed':
        errorMessage = "Google sign-in is not enabled. Please contact support";
        break;
      default:
        errorMessage = error.message;
    }

    toast({
      title: "Error signing in",
      description: errorMessage,
      variant: "destructive",
    });
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