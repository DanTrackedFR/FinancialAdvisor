import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { Loader2, Edit, CreditCard, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  company: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubscriptionPending, setIsSubscriptionPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize the form outside the conditional rendering
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      surname: "",
      company: "",
    },
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!user) return null;
      console.log("Fetching profile for user:", user.uid);
      try {
        // Get the ID token for more secure authentication
        const idToken = await user.getIdToken();
        
        // Use the /me endpoint which is protected by the isAuthenticated middleware
        const response = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${idToken}`,
            "firebase-uid": user.uid,
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          console.error("Profile fetch failed:", response.status, response.statusText);
          throw new Error("Failed to fetch profile");
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return response.json();
        } else {
          console.error("Non-JSON response received:", contentType);
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 1,
    retryDelay: 1000,
  });

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        surname: profile.surname || "",
        company: profile.company || "",
      });
    }
  }, [profile, form]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user) throw new Error("Not authenticated");
      console.log("Updating profile with data:", data);

      try {
        // Get the ID token for more secure authentication
        const idToken = await user.getIdToken();
        
        const response = await fetch("/api/auth/users/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
            "firebase-uid": user.uid,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          console.error("Profile update failed:", response.status, response.statusText);
          throw new Error("Failed to update profile");
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return response.json();
        } else {
          console.error("Non-JSON response received:", contentType);
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Profile update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleManageSubscription = async () => {
    try {
      if (!user) {
        throw new Error("Not authenticated");
      }
      setIsSubscriptionPending(true);
      console.log("Starting subscription management process...");

      // Get the ID token for more secure authentication
      const idToken = await user.getIdToken();
      
      const response = await fetch("/api/auth/subscriptions/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
          "firebase-uid": user.uid,
        },
      });

      if (!response.ok) {
        console.error("Subscription management failed:", response.status, response.statusText);
        throw new Error("Failed to manage subscription");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
        console.error("Non-JSON response received for subscription:", contentType);
        throw new Error("Invalid response format");
      }

      const data = await response.json();
      console.log("Received response from server:", data);

      if (!data.url) {
        throw new Error("No checkout URL received from server");
      }

      // Validate URL format
      try {
        new URL(data.url);
      } catch (e) {
        throw new Error("Invalid checkout URL received from server");
      }

      console.log("Opening Stripe checkout:", data.url);
      // Open in new window for better compatibility
      const checkoutWindow = window.open(data.url, "_blank");

      if (!checkoutWindow) {
        // If popup was blocked, try direct navigation
        console.log("Popup blocked, trying direct navigation");
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Error managing subscription",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubscriptionPending(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    updateProfile(data);
  };
  
  // Function to handle account deletion
  const handleDeleteAccount = async () => {
    try {
      if (!user) {
        throw new Error("Not authenticated");
      }
      
      setIsDeleting(true);
      console.log("Starting account deletion process...");
      
      // Get the ID token for secure authentication
      const idToken = await user.getIdToken();
      
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      });
      
      if (!response.ok) {
        console.error("Account deletion failed:", response.status, response.statusText);
        throw new Error("Failed to delete your account. Please try again later.");
      }
      
      // Show success message
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      
      // Log the user out
      await logout();
      
      // Redirect to home page
      window.location.href = "/";
    } catch (error: any) {
      console.error("Account deletion error:", error);
      toast({
        title: "Error deleting account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  function formatDate(date: Date | string | null) {
    if (!date) return "";
    // Parse the date string into a Date object if it's a string
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    return dateObject.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getSubscriptionStatusDisplay(status: string) {
    switch (status) {
      case "trial":
        return "Free Trial";
      case "active":
        return "Active";
      case "cancelled":
        return "Cancelled";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  View or update your profile details
                </CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surname</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your surname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Name</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.firstName} {profile?.surname}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Company</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.company || "Not specified"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Information Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Current Plan</h3>
                <p className="text-sm text-muted-foreground">
                  {getSubscriptionStatusDisplay(
                    profile?.subscriptionStatus || "trial",
                  )}
                </p>
              </div>
              {profile?.trialEndsAt &&
                profile.subscriptionStatus === "trial" && (
                  <div>
                    <h3 className="font-medium">Trial Period</h3>
                    <p className="text-sm text-muted-foreground">
                      Your trial ends on {formatDate(profile.trialEndsAt)}
                    </p>
                  </div>
                )}
              {profile?.subscriptionEndsAt &&
                profile.subscriptionStatus === "active" && (
                  <div>
                    <h3 className="font-medium">Next Billing Date</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(profile.subscriptionEndsAt)}
                    </p>
                  </div>
                )}
              <div className="pt-4">
                <Button
                  onClick={handleManageSubscription}
                  disabled={isSubscriptionPending}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isSubscriptionPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : profile?.subscriptionStatus === "trial" ? (
                    "Upgrade to Premium"
                  ) : (
                    "Manage Subscription"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Deletion Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Account Management</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-medium text-destructive">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="space-y-4">
                      <p>
                        This action will permanently delete your account and all associated data, including:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Your profile information</li>
                        <li>All analyses and documents</li>
                        <li>Subscription and payment details</li>
                        <li>Feedback and message history</li>
                      </ul>
                      <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md mt-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                        <p className="text-sm text-amber-800">This action cannot be undone. Your data will be lost forever.</p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}