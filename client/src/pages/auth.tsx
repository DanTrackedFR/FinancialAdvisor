import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { SiGoogle } from "react-icons/si";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <div className="max-w-sm w-full space-y-8">
          <div className="text-center">
            <img
              src="/assets/Color logo - no background.png"
              alt="TrackedFR Logo"
              className="h-12 mx-auto"
            />
            <h2 className="mt-6 text-3xl font-bold">Welcome to Tracked</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to start analyzing your financial statements
            </p>
          </div>

          <Button
            onClick={signInWithGoogle}
            className="w-full"
            variant="outline"
          >
            <SiGoogle className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </div>
      </div>

      <div className="hidden lg:block bg-slate-50">
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-lg space-y-8">
            <h2 className="text-4xl font-bold">
              Transform Your Financial Reporting
            </h2>
            <p className="text-xl text-muted-foreground">
              Use our AI-powered platform to automate and streamline your financial
              statement preparation process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
