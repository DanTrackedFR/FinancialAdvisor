import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';

export default function BigQueryPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Check if current user is an admin
  // Using a type assertion since we know our user object has this property
  const isAdmin = user && (user as any).isAdmin === true;

  // Redirect non-admins
  if (!isAdmin) {
    setLocation('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Integration</CardTitle>
          <CardDescription>
            Database functionality will be added at a later date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>The database integration has been removed and will be implemented in the future.</p>
        </CardContent>
      </Card>
    </div>
  );
}