import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Privacy from "@/pages/privacy";
import Cookies from "@/pages/cookies";
import Terms from "@/pages/terms";
import Auth from "@/pages/auth";
import VerifyEmail from "@/pages/verify-email"; // Import the new verify-email page
import Profile from "@/pages/profile";
import Users from "@/pages/users";
import Chat from "@/pages/chat";
import Analysis from "@/pages/analysis";
import NewAnalysis from "@/pages/new-analysis";
import BigQueryAdmin from "@/pages/admin/bigquery";
import AdminLogin from "@/pages/admin/login"; 
import AdminDashboard from "@/pages/admin/dashboard"; // Import the main admin dashboard
import ManageUsers from "@/pages/admin/manage-users"; 
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./components/protected-route";
import { AdminProtectedRoute } from "./components/admin-protected-route"; 
import { Navigation } from "./components/navigation";
import { useAuth } from "@/hooks/use-auth";

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {user && <Navigation />}
      {children}
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={Auth} />
        <Route path="/verify-email" component={VerifyEmail} /> {/* Add the verify-email route */}
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/cookies" component={Cookies} />


        <ProtectedRoute path="/chat" component={Chat} />
        <ProtectedRoute path="/analysis" component={Analysis} />
        <ProtectedRoute path="/analysis/:id" component={Analysis} />
        <ProtectedRoute path="/new-analysis" component={NewAnalysis} />
        <ProtectedRoute path="/profile" component={Profile} />
        <ProtectedRoute path="/users" component={Users} />

        {/* Admin routes with special protection */}
        <Route path="/admin/login" component={AdminLogin} />
        <AdminProtectedRoute path="/admin" component={AdminDashboard} />
        <AdminProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
        <AdminProtectedRoute path="/admin/bigquery" component={BigQueryAdmin} />
        <AdminProtectedRoute path="/admin/manage-users" component={ManageUsers} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;