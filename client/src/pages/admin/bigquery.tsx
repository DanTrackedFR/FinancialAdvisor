import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Redirect } from 'react-router-dom';

export default function BigQueryPage() {
  const { user } = useAuth();

  // Check if current user is an admin
  const isAdmin = user && user.isAdmin === true;

  // Redirect non-admins
  if (!isAdmin) {
    return <Redirect to="/" />;
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