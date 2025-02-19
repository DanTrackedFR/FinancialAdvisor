import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [location] = useLocation();

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
            <Link to="/chat">Chat</Link>
          </Button>
          <Button variant={location === "/analysis" ? "default" : "ghost"} asChild>
            <Link to="/analysis">Analysis</Link>
          </Button>
          <Button variant={location === "/profile" ? "default" : "ghost"} asChild>
            <Link to="/profile">Profile</Link>
          </Button>
          <Button variant={location === "/admin/analytics" ? "default" : "ghost"} asChild>
            <Link to="/admin/analytics">Analytics</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign Out</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}