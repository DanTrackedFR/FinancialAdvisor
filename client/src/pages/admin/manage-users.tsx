import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, UserCog, ShieldAlert, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

export default function ManageUsers() {
  const { user, updateUserFirebaseUid } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch all users from the database
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        headers: {
          'firebase-uid': user?.uid || '',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    enabled: !!user?.isAdmin,
  });

  // Check if the current user is an admin
  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center text-6xl py-6">
            <ShieldAlert />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation('/')}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleUpdateFirebaseUid = async () => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      const success = await updateUserFirebaseUid(selectedUser.email, user.uid);
      
      if (success) {
        toast({
          title: 'Firebase UID Updated',
          description: `Successfully updated Firebase UID for ${selectedUser.email}`,
        });
        refetch();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating Firebase UID:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update Firebase UID',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">Administer user accounts and permissions</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>
            View and manage all registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Firebase UID</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.firstName} {user.surname}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {user.firebaseUid || 'Not set'}
                  </TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Badge variant="default">Admin</Badge>
                    ) : (
                      <Badge variant="outline">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Dialog open={isDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </DialogTrigger>
                      {selectedUser && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update User Firebase UID</DialogTitle>
                            <DialogDescription>
                              Update the Firebase UID for {selectedUser.email}. 
                              This will link this database account with your current Firebase authentication.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <p className="text-right col-span-1">Current UID:</p>
                              <Input 
                                className="col-span-3" 
                                value={selectedUser.firebaseUid || 'Not set'} 
                                disabled 
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <p className="text-right col-span-1">Your UID:</p>
                              <Input 
                                className="col-span-3" 
                                value={user.uid} 
                                disabled 
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleUpdateFirebaseUid} 
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Assign My UID
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
