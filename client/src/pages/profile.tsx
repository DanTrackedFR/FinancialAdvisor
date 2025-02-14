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
import { Loader2, Edit, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  company: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubscriptionPending, setIsSubscriptionPending] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = useQuery<User>({
    queryKey: ["/api/users/profile"],
    queryFn: async () => {
      if (!user) return null;
      const response = await fetch('/api/users/profile', {
        headers: {
          'firebase-uid': user.uid
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user) throw new Error("Not authenticated");

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'firebase-uid': user.uid
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
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
      console.log('Starting subscription management process...');

      const response = await fetch('/api/subscriptions/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase-uid': user.uid
        }
      });

      if (!response.ok) {
        throw new Error('Failed to manage subscription');
      }

      const data = await response.json();
      console.log('Received response from server:', data);

      if (!data.url) {
        throw new Error('No checkout URL received from server');
      }

      // Validate URL format
      try {
        new URL(data.url);
      } catch (e) {
        throw new Error('Invalid checkout URL received from server');
      }

      console.log('Opening Stripe checkout:', data.url);
      // Open in new window for better compatibility
      const checkoutWindow = window.open(data.url, '_blank');

      if (!checkoutWindow) {
        // If popup was blocked, try direct navigation
        console.log('Popup blocked, trying direct navigation');
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
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

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getSubscriptionStatusDisplay(status: string) {
    switch (status) {
      case 'trial':
        return 'Free Trial';
      case 'active':
        return 'Active';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
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
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
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
                          <Input {...field} />
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
                {profile?.company && (
                  <div>
                    <h3 className="font-medium">Company</h3>
                    <p className="text-sm text-muted-foreground">
                      {profile.company}
                    </p>
                  </div>
                )}
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
                  {getSubscriptionStatusDisplay(profile?.subscriptionStatus || 'trial')}
                </p>
              </div>
              {profile?.trialEndsAt && profile.subscriptionStatus === 'trial' && (
                <div>
                  <h3 className="font-medium">Trial Period</h3>
                  <p className="text-sm text-muted-foreground">
                    Your trial ends on {formatDate(profile.trialEndsAt)}
                  </p>
                </div>
              )}
              {profile?.subscriptionEndsAt && profile.subscriptionStatus === 'active' && (
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
                  ) : profile?.subscriptionStatus === 'trial' ? (
                    'Upgrade to Premium'
                  ) : (
                    'Manage Subscription'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}