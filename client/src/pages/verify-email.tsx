import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { isSignInWithEmailLink, signInWithEmailLink, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { toast } = useToast();
  const auth = getAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if the current URL is a sign-in link
        if (isSignInWithEmailLink(auth, window.location.href)) {
          // Get email from localStorage (we stored it during sign-up)
          let email = localStorage.getItem("emailForSignIn");

          console.log("Retrieved email from localStorage:", email);

          // If not in localStorage, try to extract from URL query parameters
          if (!email) {
            try {
              const urlParams = new URLSearchParams(window.location.search);
              email = urlParams.get('email');
              console.log("Email extracted from URL:", email);
            } catch (e) {
              console.error("Error extracting email from URL:", e);
            }
          }

          if (!email) {
            // If we can't find the email in localStorage or URL, prompt user
            email = window.prompt("Please provide your email for confirmation");
            console.log("User provided email:", email);
          }

          if (email) {
            // Complete the sign-in process
            console.log("Attempting to sign in with email link:", email);
            await signInWithEmailLink(auth, email, window.location.href);

            // Get the temporarily stored password (if any)
            const tempPassword = localStorage.getItem("tempPassword");
            console.log("Found temporary password:", tempPassword ? "Yes" : "No");

            // Clear the email and temp password from localStorage
            localStorage.removeItem("emailForSignIn");
            if (tempPassword) {
              localStorage.removeItem("tempPassword");
            }

            // Set success status
            setStatus("success");

            // Show toast notification
            toast({
              title: "Email Verified",
              description: "Your email has been verified successfully. You can now log in to your account.",
            });

            // Redirect after 3 seconds
            setTimeout(() => {
              navigate("/auth?mode=login");
            }, 3000);
          } else {
            throw new Error("Email is required to complete verification");
          }
        } else {
          throw new Error("Invalid verification link");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");

        toast({
          title: "Verification Failed",
          description: error instanceof Error ? error.message : "Failed to verify email",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [auth, navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            Verifying your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center">Verifying your email address...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-center font-medium text-lg">Your email has been verified successfully!</p>
              <p className="text-center text-muted-foreground mt-2">
                You will be redirected to the login page in a few seconds.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-center font-medium text-lg">Verification failed</p>
              <p className="text-center text-muted-foreground mt-2">
                {errorMessage || "An error occurred during email verification."}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status !== "loading" && (
            <Button onClick={() => navigate("/auth?mode=login")}>
              Go to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}