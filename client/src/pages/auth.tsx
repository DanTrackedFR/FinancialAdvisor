import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  company: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .refine(
      (password) => /[A-Z]/.test(password),
      "Password must contain at least one uppercase letter"
    )
    .refine(
      (password) => /[a-z]/.test(password),
      "Password must contain at least one lowercase letter"
    )
    .refine(
      (password) => /[0-9]/.test(password),
      "Password must contain at least one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms & Conditions"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, isLoading, signUp, login, signInWithGoogle } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      surname: "",
      company: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    mode: "onChange", 
  });

  useEffect(() => {
    const subscription = signUpForm.watch(() => {
      if (Object.keys(signUpForm.formState.errors).length > 0) {
        console.log("Form validation errors:", signUpForm.formState.errors);
      }
    });
    return () => subscription.unsubscribe();
  }, [signUpForm]);

  const onSubmit = async (data: LoginFormData | SignUpFormData) => {
    try {
      if (mode === "signup") {
        if (!signUpForm.formState.isValid) {
          console.log("Form is invalid, cannot submit");
          return;
        }

        const { confirmPassword, acceptTerms, ...signUpData } = data as SignUpFormData;
        setVerificationEmail(signUpData.email);
        localStorage.setItem("emailForSignIn", signUpData.email);
        console.log("Submitting signup form with data:", signUpData);
        
        // Set explicit flag to prevent home page redirection
        localStorage.setItem("signupInProgress", "true");
        
        try {
          // Save the email to use in verification dialog
          const userEmail = signUpData.email;
          setVerificationEmail(userEmail);
          
          // Store the email in localStorage so we can recover it if needed
          localStorage.setItem("verificationEmail", userEmail);
          
          // First process the sign-up
          await signUp(signUpData);
          
          console.log("Sign up successful, showing verification dialog");
          
          // Force immediate rendering of dialog using various techniques
          
          // 1. Add the verification pending class to prevent navigation
          document.body.classList.add('verification-pending');
          
          // 2. Set immediate state
          setShowVerificationDialog(true);
          console.log("Dialog visibility set to true initially");
          
          // 3. Use a microtask to ensure rendering occurs after current stack
          Promise.resolve().then(() => {
            setShowVerificationDialog(true);
            console.log("Dialog visibility set via microtask");
          });
          
          // 4. Multiple timed attempts to ensure dialog appears 
          // First check/retry after 100ms
          setTimeout(() => {
            const dialogElement = document.querySelector('.verification-dialog-content');
            if (!dialogElement) {
              console.log("Dialog not visible after 100ms, forcing display");
              setShowVerificationDialog(false);
              
              requestAnimationFrame(() => {
                setShowVerificationDialog(true);
                console.log("Dialog visibility forced via requestAnimationFrame");
              });
            }
          }, 100);
          
          // Second check/retry after 500ms
          setTimeout(() => {
            const dialogElement = document.querySelector('.verification-dialog-content');
            if (!dialogElement) {
              console.log("Dialog not visible after 500ms, forcing display");
              setShowVerificationDialog(false);
              
              setTimeout(() => {
                setShowVerificationDialog(true);
                console.log("Dialog visibility forced again");
                
                // Set up a continuous interval to keep checking and enforcing visibility
                const visibilityInterval = setInterval(() => {
                  if (!document.querySelector('.verification-dialog-content') && 
                      localStorage.getItem("signupInProgress") === "true") {
                    console.log("Dialog disappeared, forcing display again");
                    setShowVerificationDialog(true);
                  }
                }, 1000);
                
                // Clean up after 30 seconds
                setTimeout(() => clearInterval(visibilityInterval), 30000);
              }, 50);
            }
          }, 500);
          
          // Toast notification for email verification 
          toast({
            title: "Sign Up Successful",
            description: "Please check your email to verify your account.",
          });
          
        } catch (signupError) {
          // Remove the flag since signup failed
          localStorage.removeItem("signupInProgress");
          
          toast({
            title: "Sign Up Failed",
            description: signupError instanceof Error ? signupError.message : "Failed to create account",
            variant: "destructive",
          });
          
          throw signupError; // Re-throw to be caught by outer catch
        }
      } else {
        await login(data.email, data.password);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleTabChange = useCallback((value: string) => {
    setMode(value as "login" | "signup");
    loginForm.reset();
    signUpForm.reset();
  }, [loginForm, signUpForm]);

  const handleVerificationDialogClose = () => {
    console.log("Closing verification dialog");
    
    // First set the dialog state to closed
    setShowVerificationDialog(false);
    
    // Reset the form
    signUpForm.reset();
    
    // Switch to login mode
    setMode("login");
    
    // Clean up all signup flags to ensure consistent state
    localStorage.removeItem("signupInProgress");
    localStorage.removeItem("justSignedUp");
    localStorage.removeItem("verificationEmail");
    
    // Remove the verification pending class
    document.body.classList.remove('verification-pending');
    
    // Show toast to remind user to check email
    toast({
      title: "Check your email",
      description: "Please verify your account by clicking the link we sent to your email (check spam/junk folder if not visible).",
    });
    
    // Add a log to verify everything was cleaned up
    console.log("Verification dialog closed, flags cleaned up");
  };

  // Check for pending verification on component mount
  useEffect(() => {
    // If there's a signup in progress flag, show the verification dialog
    if (localStorage.getItem("signupInProgress") === "true") {
      console.log("Found signupInProgress flag, restoring verification dialog");
      // Attempt to restore the email being verified
      const email = localStorage.getItem("verificationEmail");
      if (email) {
        setVerificationEmail(email);
      }
      
      // Show the dialog with a small delay to ensure DOM is ready
      setTimeout(() => {
        setShowVerificationDialog(true);
        console.log("Verification dialog restored");
        
        // Add the verification pending class
        document.body.classList.add('verification-pending');
        
        // Set up an interval to periodically check if dialog is visible
        // and force it to be visible if it's not
        const dialogCheckInterval = setInterval(() => {
          const dialogElement = document.querySelector('.verification-dialog-content');
          if (!dialogElement && localStorage.getItem("signupInProgress") === "true") {
            console.log("Dialog not found, forcing display");
            setShowVerificationDialog(false);
            
            // Use a microtask to ensure state updates properly
            Promise.resolve().then(() => {
              setShowVerificationDialog(true);
              console.log("Dialog visibility forced true");
            });
          }
        }, 500); // Check every 500ms
        
        // Clean up interval after 30 seconds
        setTimeout(() => {
          clearInterval(dialogCheckInterval);
        }, 30000);
        
        return () => {
          clearInterval(dialogCheckInterval);
        };
      }, 100);
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modeParam = searchParams.get("mode");
    if (modeParam === "login" || modeParam === "signup") {
      setMode(modeParam);
    }

    const verifiedEmail = window.localStorage.getItem('emailForSignIn');
    if (verifiedEmail && modeParam === "login") {
      loginForm.setValue("email", verifiedEmail);
      
      // Check if we have stored credentials from verification
      const verifiedCredentialsJson = window.localStorage.getItem('verifiedUserCredentials');
      if (verifiedCredentialsJson) {
        try {
          const verifiedCredentials = JSON.parse(verifiedCredentialsJson);
          // Only use the stored password if it's for the same email and recent (within 1 hour)
          if (verifiedCredentials.email === verifiedEmail && 
              (Date.now() - verifiedCredentials.timestamp) < 3600000) {
            // Auto-fill the password field if we have verified credentials
            loginForm.setValue("password", verifiedCredentials.password);
            
            toast({
              title: "Account Verified",
              description: "Your account has been verified. You can now log in.",
            });
          } else {
            // Clear outdated credentials
            window.localStorage.removeItem('verifiedUserCredentials');
          }
        } catch (e) {
          console.error("Error parsing verified credentials:", e);
          window.localStorage.removeItem('verifiedUserCredentials');
        }
      }
      
      // Remove the email from storage after it's been used
      window.localStorage.removeItem('emailForSignIn');
      toast({
        title: "Email Pre-filled",
        description: "Your verified email has been filled in. Please enter your password to log in.",
      });
    }
  }, [loginForm, toast]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    setTimeout(() => {
      setLocation("/");
    }, 0);
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <img
              src="/assets/Color logo - no background.png"
              alt="TrackedFR Logo"
              className="h-12 mx-auto"
            />
            <CardTitle className="mt-6 text-3xl">Welcome to Tracked</CardTitle>
            <CardDescription>
              {mode === "login" ? "Sign in to continue" : "Create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {mode === "login" ? (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <input
                        type="password"
                        id="loginPassword"
                        placeholder="Enter your password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-10 px-3"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full mb-4">
                      {loginForm.formState.isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        signInWithGoogle().catch((error) => {
                          console.error("Google sign-in error:", error);
                        });
                      }}
                    >
                      <svg className="mr-2 h-4 w-4" 
                           aria-hidden="true" 
                           focusable="false" 
                           data-icon="google"
                           role="img"
                           xmlns="http://www.w3.org/2000/svg" 
                           viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                      </svg>
                      Sign in with Google
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          placeholder="Enter your first name"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-10 px-3"
                          {...signUpForm.register("firstName")}
                        />
                        {signUpForm.formState.errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">
                            {signUpForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
                          Surname
                        </label>
                        <input
                          type="text"
                          id="surname"
                          placeholder="Enter your surname"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-10 px-3"
                          {...signUpForm.register("surname")}
                        />
                        {signUpForm.formState.errors.surname && (
                          <p className="text-red-500 text-sm mt-1">
                            {signUpForm.formState.errors.surname.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        id="company"
                        placeholder="Enter your company name"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-10 px-3"
                        {...signUpForm.register("company")}
                      />
                      {signUpForm.formState.errors.company && (
                        <p className="text-red-500 text-sm mt-1">
                          {signUpForm.formState.errors.company.message}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <input
                        type="password"
                        id="signupPassword"
                        placeholder="Enter your password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-10 px-3"
                        {...signUpForm.register("password")}
                        onChange={(e) => {
                          signUpForm.register("password").onChange(e);
                          signUpForm.trigger("password");
                        }}
                      />
                      {signUpForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {signUpForm.formState.errors.password.message}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Password must:
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                          <li>Be at least 6 characters long</li>
                          <li>Include at least one uppercase letter</li>
                          <li>Include at least one lowercase letter</li>
                          <li>Include at least one number</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm your password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-10 px-3"
                        {...signUpForm.register("confirmPassword")}
                        onChange={(e) => {
                          signUpForm.register("confirmPassword").onChange(e);
                          signUpForm.trigger("confirmPassword");
                        }}
                      />
                      {signUpForm.formState.errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {signUpForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <FormField
                      control={signUpForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I accept the{" "}
                              <Link href="/terms" className="text-primary hover:underline">
                                Terms & Conditions
                              </Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full mb-4"
                      disabled={!signUpForm.formState.isValid || signUpForm.formState.isSubmitting}
                    >
                      {signUpForm.formState.isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or sign up with
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        signInWithGoogle().catch((error) => {
                          console.error("Google sign-in error:", error);
                        });
                      }}
                    >
                      <svg className="mr-2 h-4 w-4" 
                           aria-hidden="true" 
                           focusable="false" 
                           data-icon="google"
                           role="img"
                           xmlns="http://www.w3.org/2000/svg" 
                           viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                      </svg>
                      Sign up with Google
                    </Button>
                  </form>
                </Form>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <AlertDialog 
        open={showVerificationDialog} 
        onOpenChange={(open) => {
          // Only allow changes when closing
          if (!open) {
            handleVerificationDialogClose();
          }
        }}
      >
        <div 
          className="verification-dialog-overlay" 
          onClick={(e) => {
            // Stop propagation to prevent accidental closing
            e.stopPropagation();
            
            // Focus the dialog button when clicking anywhere on overlay
            const actionButton = document.querySelector('.verification-dialog-content button');
            if (actionButton) {
              (actionButton as HTMLElement).focus();
            }
          }}
        >
          <AlertDialogContent 
            className="verification-dialog-content" 
            onEscapeKeyDown={(e) => {
              // Prevent accidental escape key dismissal
              e.preventDefault();
            }}
            // Force focus trap to ensure keyboard accessibility
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              const actionButton = document.querySelector('.verification-dialog-content button');
              if (actionButton) {
                (actionButton as HTMLElement).focus();
              }
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-center">
                Email Verification Required
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                <p className="font-medium text-lg">
                  We've sent a verification email to:
                </p>
                <p className="font-bold text-primary text-lg mt-2 mb-2">
                  {verificationEmail}
                </p>
                <p className="mt-2">
                  You must verify your email before continuing.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 text-sm text-muted-foreground bg-slate-50 rounded-md p-4 my-2">
              <p className="mb-2 font-bold text-base text-red-500">
                IMPORTANT: You won't be able to log in until you verify your email address.
              </p>
              <p className="mb-2">
                ✉️ If you don't see the email in your inbox, please check your spam or junk folder.
              </p>
              <p>
                ✅ Once your email is verified, you can sign in to your account using your credentials.
              </p>
            </div>
            <AlertDialogFooter className="flex justify-center">
              <AlertDialogAction 
                onClick={handleVerificationDialogClose}
                className="bg-primary hover:bg-primary/90 font-bold text-base px-8 py-2"
                autoFocus
              >
                I'll check my email now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </div>
      </AlertDialog>

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