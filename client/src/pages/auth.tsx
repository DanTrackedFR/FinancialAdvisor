import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
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
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = loginSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  company: z.string().optional(),
  confirmPassword: z.string().min(1, "Please confirm your password"),
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
      email: "",
      password: "",
      firstName: "",
      surname: "",
      company: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: LoginFormData | SignUpFormData) => {
    try {
      if (mode === "signup") {
        // Remove confirmPassword before sending to the auth hook
        const { confirmPassword, ...signUpData } = data as SignUpFormData;
        await signUp(signUpData);
      } else {
        await login(data.email, data.password);
      }
    } catch (error) {
      // Error handling is done in useAuth
    }
  };

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
            <Tabs value={mode} onValueChange={(v) => {
              setMode(v as "login" | "signup");
              // Reset forms when switching modes
              loginForm.reset();
              signUpForm.reset();
            }}>
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
                            <Input 
                              placeholder="Enter your email"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                    <FormField
                      control={signUpForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              placeholder="Enter your first name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname</FormLabel>
                          <FormControl>
                            <Input
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              placeholder="Enter your surname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              placeholder="Enter your company name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              placeholder="Enter your email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              placeholder="Enter your password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              placeholder="Confirm your password"
                              className={
                                signUpForm.formState.errors.confirmPassword
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
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