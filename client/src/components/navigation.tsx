import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo on the left */}
        <Link to="/" className="flex-none">
          <img 
            src="../public/Color logo - no background.png" 
            alt="Tracked Logo" 
            className="h-8"
          />
        </Link>

        {/* Navigation buttons on the right */}
        <div className="flex items-center space-x-4">
          <Link to="/profile">
            <Button variant={location === "/profile" ? "default" : "ghost"}>
              Profile
            </Button>
          </Link>
          <Link to="/analysis">
            <Button variant={location === "/analysis" ? "default" : "ghost"}>
              Analysis
            </Button>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign Out</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}