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
  const { user, isLoading, signUp, login } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  // Initialize URL search params to set initial mode
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modeParam = searchParams.get("mode");
    if (modeParam === "login" || modeParam === "signup") {
      setMode(modeParam);
    }
  }, []);

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
    mode: "onChange", // Validate on change for immediate feedback
  });

  // Debug logging for validation errors
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
        // Only proceed if the form is valid
        if (!signUpForm.formState.isValid) {
          console.log("Form is invalid, cannot submit");
          return;
        }

        const { confirmPassword, acceptTerms, ...signUpData } = data as SignUpFormData;
        // Store the email for the verification dialog
        setVerificationEmail(signUpData.email);

        // Save email in localStorage for verification process
        localStorage.setItem("emailForSignIn", signUpData.email);

        console.log("Submitting signup form with data:", signUpData);
        await signUp(signUpData);
        // Show verification dialog after successful signup
        setShowVerificationDialog(true);
      } else {
        await login(data.email, data.password);
      }
    } catch (error) {
      // Error handling is done in useAuth
      console.error("Form submission error:", error);
    }
  };

  // Handle tab change safely with useCallback
  const handleTabChange = useCallback((value: string) => {
    setMode(value as "login" | "signup");
    loginForm.reset();
    signUpForm.reset();
  }, [loginForm, signUpForm]);

  // Handle verification dialog close
  const handleVerificationDialogClose = () => {
    setShowVerificationDialog(false);
    // Reset signup form
    signUpForm.reset();
    // Switch to login mode
    setMode("login");
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in, redirect to home
  if (user) {
    // Use useEffect in the component body to handle navigation
    // This prevents state updates during rendering
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
                    <Button type="submit" className="w-full">
                      {loginForm.formState.isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Sign In"
                      )}
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
                          // Trigger validation on password field immediately
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
                          // Trigger validation on confirmPassword field immediately
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
                      className="w-full"
                      disabled={!signUpForm.formState.isValid || signUpForm.formState.isSubmitting}
                    >
                      {signUpForm.formState.isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Email Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Email</DialogTitle>
            <DialogDescription>
              We've sent a verification email to <span className="font-medium">{verificationEmail}</span>. 
              Please click the link in that email to verify your account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            <p className="mb-2">
              If you don't see the email in your inbox, please check your spam or junk folder.
            </p>
            <p>
              Once your email is verified, you can sign in to your account using your credentials.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleVerificationDialogClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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