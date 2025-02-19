import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, User, LogOut, BarChart2 } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Don't render navigation if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo on the left */}
        <Link to="/" className="flex-none">
          <img 
            src="/assets/Black logo - no background.png" 
            alt="Tracked Logo" 
            className="h-8"
          />
        </Link>

        {/* Navigation buttons on the right */}
        <div className="flex items-center space-x-4">
          <Button variant={location === "/chat" ? "default" : "ghost"} asChild>
            <Link to="/chat" className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Link>
          </Button>
          <Button variant={location === "/profile" ? "default" : "ghost"} asChild>
            <Link to="/profile" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </Button>
          <Button variant={location === "/admin/analytics" ? "default" : "ghost"} asChild>
            <Link to="/admin/analytics" className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}