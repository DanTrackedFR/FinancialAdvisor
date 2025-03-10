import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, AlertCircle, Server } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function BigQueryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);
  const [testComplete, setTestComplete] = useState<{status: string, message: string} | null>(null);

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
          
          console.log(`BigQuery Page: Admin verification completed for ${user.email}:`, data.isAdmin);
          
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

  // Test admin security system
  const testAdminSecurity = async () => {
    if (!user) return;
    
    try {
      setTestComplete(null);
      
      // Get a fresh token
      const idToken = await user.getIdToken(true);
      
      // Test the admin security endpoint
      const response = await fetch('/api/auth/admin-status', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setTestComplete({
          status: data.isAdmin ? 'success' : 'warning',
          message: data.isAdmin 
            ? 'Admin verification successful. You have admin privileges.' 
            : 'Security check passed, but you do not have admin privileges.'
        });
        
        toast({
          title: 'Security Test Complete',
          description: data.isAdmin 
            ? 'Admin verification confirmed your admin status.' 
            : 'The system correctly identified you as a non-admin user.',
          variant: data.isAdmin ? 'default' : 'destructive',
        });
      } else {
        setTestComplete({
          status: 'error',
          message: `Security test failed with status: ${response.status}`
        });
        
        toast({
          title: 'Security Test Failed',
          description: 'The admin verification system could not complete the test.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Admin security test error:", error);
      setTestComplete({
        status: 'error',
        message: 'Error occurred during security test'
      });
      
      toast({
        title: 'Security Test Error',
        description: 'An error occurred while testing the admin security system.',
        variant: 'destructive',
      });
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
              Secure administrative control panel
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
            
            {testComplete && (
              <Alert 
                variant={testComplete.status === 'success' ? 'default' : 'destructive'} 
                className={testComplete.status === 'warning' ? 'border-orange-500 bg-orange-50' : ''}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Test Result</AlertTitle>
                <AlertDescription>
                  {testComplete.message}
                </AlertDescription>
              </Alert>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Database Administration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Server className="h-4 w-4" />
                  <span>Database integration functionality will be implemented in the future.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t pt-6">
          <Button 
            variant="outline" 
            onClick={testAdminSecurity}
            disabled={verifyingAdmin || !adminVerified}
          >
            Test Admin Security
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}