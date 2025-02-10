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
import { Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const { data: profile, isLoading: isLoadingProfile } = useQuery<User>({
    queryKey: ["/api/users/profile"],
    enabled: !!user,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || "",
      surname: profile?.surname || "",
      company: profile?.company || "",
    },
    values: {
      firstName: profile?.firstName || "",
      surname: profile?.surname || "",
      company: profile?.company || "",
    },
  });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
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

  const onSubmit = async (data: ProfileFormData) => {
    updateProfile(data);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>View or update your profile details</CardDescription>
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
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium">Name</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.firstName} {profile?.surname}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                {profile?.company && (
                  <div>
                    <h3 className="font-medium">Company</h3>
                    <p className="text-sm text-muted-foreground">{profile.company}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}