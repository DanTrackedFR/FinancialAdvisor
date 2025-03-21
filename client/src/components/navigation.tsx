import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, User, LogOut, BarChart2, Menu, Star, Shield } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FeedbackDialog } from "./feedback-dialog";
import { Badge } from "@/components/ui/badge";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Don't render navigation if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo on the left */}
          <Link to="/" className="flex-none">
            <img 
              src="/assets/Black logo - no background.png" 
              alt="Tracked Logo" 
              className="h-8"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" onClick={() => setFeedbackOpen(true)} asChild>
              <div className="flex items-center cursor-pointer">
                <Star className="h-4 w-4 mr-2" />
                Feedback
              </div>
            </Button>
            <Button variant={location === "/chat" ? "default" : "ghost"} asChild>
              <Link to="/chat" className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Link>
            </Button>
            <Button variant={location === "/analysis" ? "default" : "ghost"} asChild>
              <Link to="/analysis" className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Analysis
              </Link>
            </Button>
            <Button variant={location === "/profile" ? "default" : "ghost"} asChild>
              <Link to="/profile" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>

            
            {/* Admin Dashboard Link - Only visible to admins */}
            {user.isAdmin && (
              <Button 
                variant={location.startsWith("/admin") ? "default" : "ghost"} 
                asChild
                className="bg-primary/10 hover:bg-primary/20"
              >
                <Link to="/admin" className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                  <Badge className="ml-2 text-xs px-1.5 py-0" variant="outline">Admin</Badge>
                </Link>
              </Button>
            )}
            
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[75vw] sm:w-[350px]">
                <nav className="flex flex-col gap-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    size="lg"
                    onClick={() => {
                      setFeedbackOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Feedback
                  </Button>
                  <Link to="/chat" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </Link>
                  <Link to="/analysis" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Analysis
                    </Button>
                  </Link>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>

                  
                  {/* Admin Link - Only visible to admins */}
                  {user.isAdmin && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start bg-primary/10 hover:bg-primary/20" 
                        size="lg"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                        <Badge className="ml-2 text-xs px-1.5 py-0" variant="outline">Admin</Badge>
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    size="lg"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      {/* Add a spacer div that matches the height of the nav */}
      <div className="h-16" />

      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={feedbackOpen} 
        onOpenChange={setFeedbackOpen} 
      />
    </>
  );
}