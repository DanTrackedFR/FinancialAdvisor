import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

// Admin emails list - should be kept in sync with server-side
const ADMIN_EMAILS = [
  'admin@trackedfr.com',
  'support@trackedfr.com'
  // Add other admin emails here
];

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

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

        // If user is not logged in, redirect to admin login
        if (!user) {
          // Preserve the intended destination
          return <Redirect to={`/admin/login?redirect=${encodeURIComponent(location)}`} />;
        }

        // If user is logged in but not an admin, redirect to home
        if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
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

        // User is logged in and is an admin
        return <Component />;
      }}
    </Route>
  );
}
