import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/">
            <img 
              src="/public/Color logo - no background.png" 
              alt="Tracked Logo" 
              className="h-8"
            />
          </Link>
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
          </div>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/auth">Sign Out</Link>
        </Button>
      </div>
    </nav>
  );
}