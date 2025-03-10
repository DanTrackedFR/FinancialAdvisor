import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element | null;
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  // Verify admin status with backend
  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!user) return;
      
      try {
        setVerificationLoading(true);
        // Get the Firebase ID token
        const idToken = await user.getIdToken();
        
        // Verify admin status through our dedicated endpoint
        const response = await fetch('/api/auth/admin-status', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAdminVerified(data.isAdmin === true);
          
          // Add debug log to understand the check result
          console.log(`Admin verification completed for ${user.email}:`, data.isAdmin);
          
          // Synchronize the local user object with the server status
          if (data.isAdmin !== user.isAdmin) {
            console.log("Updating local admin status to match server:", data.isAdmin);
            user.isAdmin = data.isAdmin;
          }
          
          if (!data.isAdmin) {
            toast({
              title: "Access Denied",
              description: "You do not have administrative privileges.",
              variant: "destructive",
            });
          }
        } else {
          console.error("Failed to verify admin status:", response.status);
          setAdminVerified(false);
          toast({
            title: "Verification Failed",
            description: "Unable to verify your administrative privileges.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Admin verification error:", error);
        setAdminVerified(false);
      } finally {
        setVerificationLoading(false);
      }
    };
    
    if (user && adminVerified === null) {
      verifyAdminStatus();
    }
  }, [user, adminVerified, toast]);

  return (
    <Route path={path}>
      {() => {
        // Show loading when authentication is in progress
        if (isLoading || verificationLoading) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                {verificationLoading ? "Verifying admin access..." : "Authenticating..."}
              </p>
            </div>
          );
        }

        // If user is not logged in, redirect to admin login
        if (!user) {
          // Preserve the intended destination
          return <Redirect to={`/admin/login?redirect=${encodeURIComponent(location)}`} />;
        }

        // If user is logged in but not an admin (after verification completed)
        console.log("Admin route check:", user.uid, "isAdmin:", user.isAdmin, "verified:", adminVerified);
        if (adminVerified === false) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-4">
                You do not have administrative privileges to access this page.
              </p>
              <Redirect to="/" />
            </div>
          );
        }

        // User is logged in and is a verified admin
        if (adminVerified === true) {
          return <Component />;
        }
        
        // Show loading while waiting for admin verification
        return (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying admin access...</p>
          </div>
        );
      }}
    </Route>
  );
}