import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element | null;
}) {
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [redirectToAuth, setRedirectToAuth] = useState(false);

  useEffect(() => {
    // If user is logged in but email is not verified, log them out and redirect
    if (user && !user.emailVerified) {
      const handleUnverifiedUser = async () => {
        toast({
          title: "Email Not Verified",
          description: "Please check your email to verify your account before accessing this page.",
          variant: "destructive",
        });
        
        try {
          await logout();
          setRedirectToAuth(true);
        } catch (error) {
          console.error("Error during logout:", error);
        }
      };
      
      handleUnverifiedUser();
    }
  }, [user, logout, toast]);

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user || redirectToAuth) {
          return <Redirect to="/auth?mode=login" />;
        }

        // Only render the component if the user is verified
        if (!user.emailVerified) {
          // This will likely not trigger as the effect above should handle redirection
          // It's a fallback just in case
          return <Redirect to="/auth?mode=login" />;
        }

        return <Component />;
      }}
    </Route>
  );
}
