import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ShieldCheck, 
  AlertCircle, 
  Server, 
  Users, 
  Database, 
  BarChart3,
  FileText,
  MessageSquare,
  Activity
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);

  // Verify admin status with backend on component mount
  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!user) return;
      
      try {
        setVerifyingAdmin(true);
        // Get the Firebase ID token
        const idToken = await user.getIdToken();
        
        // Verify admin status through our dedicated endpoint
        const response = await fetch('/api/auth/admin-status', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAdminVerified(data.isAdmin === true);
          
          console.log(`Admin Dashboard: Admin verification completed for ${user.email}:`, data.isAdmin);
          
          // Synchronize the user object if needed
          if (user.isAdmin !== data.isAdmin) {
            user.isAdmin = data.isAdmin;
          }
          
          if (!data.isAdmin) {
            toast({
              title: "Access Denied",
              description: "You do not have administrative privileges to access this page.",
              variant: "destructive",
            });
            setLocation('/');
          }
        } else {
          console.error("Failed to verify admin status:", response.status);
          setAdminVerified(false);
          toast({
            title: "Verification Failed",
            description: "Unable to verify your administrative privileges.",
            variant: "destructive",
          });
          setLocation('/');
        }
      } catch (error) {
        console.error("Admin verification error:", error);
        setAdminVerified(false);
        setLocation('/');
      } finally {
        setVerifyingAdmin(false);
      }
    };
    
    verifyAdminStatus();
  }, [user, toast, setLocation]);

  // Navigate to another admin section
  const navigateTo = (path: string) => {
    if (adminVerified) {
      setLocation(path);
    }
  };

  // Redirect non-admins
  if (adminVerified === false) {
    return null; // Already redirected in the useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Admin Dashboard
            </CardTitle>
            <CardDescription>
              Central administration control panel
            </CardDescription>
          </div>
          <Badge variant={adminVerified ? "default" : "outline"} className={adminVerified ? "bg-green-500 hover:bg-green-600" : ""}>
            {adminVerified ? "Admin Verified" : "Verifying..."}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-primary/20 bg-primary/5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <AlertTitle>Authentication Status</AlertTitle>
              <AlertDescription>
                {verifyingAdmin 
                  ? "Verifying your administrator credentials..." 
                  : adminVerified 
                    ? "You are authenticated as an administrator with full access to all admin features." 
                    : "Admin verification pending. Please wait..."}
              </AlertDescription>
            </Alert>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Users Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <div className="text-2xl font-bold">--</div>
                    <Badge className="ml-2" variant="outline">
                      Data Available Soon
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Documents Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Analyses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    <div className="text-2xl font-bold">--</div>
                    <Badge className="ml-2" variant="outline">
                      Data Available Soon
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Active Chats Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                    <div className="text-2xl font-bold">--</div>
                    <Badge className="ml-2" variant="outline">
                      Data Available Soon
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* System Status Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-500" />
                    <div className="text-lg font-medium">Operational</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Admin Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {/* User Management Card */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => navigateTo('/admin/manage-users')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View, edit, and manage system users and their permissions.
                  </p>
                </CardContent>
              </Card>
              
              {/* Database Administration Card */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigateTo('/admin/bigquery')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Database className="h-5 w-5 mr-2 text-primary" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Database monitoring, management and advanced queries.
                  </p>
                </CardContent>
              </Card>
              
              {/* Analytics Card */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-70"
                onClick={() => toast({
                  title: "Coming Soon",
                  description: "Analytics dashboard is under development",
                })}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                      Analytics
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View system usage, user metrics, and performance analytics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t pt-6">
          <Button 
            variant="default"
            onClick={() => setLocation('/')}
          >
            Return to Main App
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}