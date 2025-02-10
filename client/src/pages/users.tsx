import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { User } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function Users() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <div className="grid gap-4">
        {users?.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex flex-col gap-2">
              <p className="font-semibold">
                {user.firstName} {user.surname}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.company && (
                <p className="text-sm text-muted-foreground">{user.company}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
