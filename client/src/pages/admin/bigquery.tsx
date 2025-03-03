import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Upload, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from "wouter";

interface BigQueryStatus {
  configured: boolean;
  credentials: string | null;
  keyFilePath: string;
  datasetId: string;
}

export default function BigQueryAdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('status');

  // Check if current user is an admin using isAdmin field
  const isAdmin = user && user.isAdmin === true;

  // Redirect non-admins
  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  // Fetch BigQuery status
  const { 
    data: statusData, 
    isLoading: isStatusLoading, 
    isError: isStatusError,
    refetch: refetchStatus
  } = useQuery<BigQueryStatus>({
    queryKey: ['/api/bigquery/status'],
    enabled: !!isAdmin
  });

  // Initialize BigQuery resources mutation
  const { 
    mutate: initializeBigQuery,
    isPending: isInitializing
  } = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/bigquery/initialize', {
        method: 'POST',
        headers: { 'firebase-uid': user?.uid || '' }
      } as any);
    },
    onSuccess: () => {
      toast({
        title: 'BigQuery resources initialized',
        description: 'Dataset and tables have been created successfully.',
        variant: 'default'
      });
      refetchStatus();
    },
    onError: (error) => {
      toast({
        title: 'Initialization failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  });

  // Export data to BigQuery mutation
  const {
    mutate: exportToBigQuery,
    isPending: isExporting
  } = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/bigquery/export', {
        method: 'POST',
        headers: { 'firebase-uid': user?.uid || '' }
      } as any);
    },
    onSuccess: () => {
      toast({
        title: 'Data exported to BigQuery',
        description: 'All data has been successfully exported to BigQuery.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">BigQuery Integration</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>BigQuery Integration Status</CardTitle>
              <CardDescription>
                View the current status of your BigQuery integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isStatusLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isStatusError ? (
                <Alert variant="destructive" className="mb-4">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to fetch BigQuery status
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Configuration Status:</span>
                    <Badge variant={statusData?.configured ? "default" : "outline"}>
                      {statusData?.configured ? "Configured" : "Not Configured"}
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Configuration Details</h3>
                    <div className="text-sm space-y-2">
                      <p><span className="font-medium">Dataset ID:</span> {statusData?.datasetId}</p>
                      <p><span className="font-medium">Credentials Path:</span> {statusData?.credentials || "Not set"}</p>
                      <p><span className="font-medium">Key File Path:</span> {statusData?.keyFilePath}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => refetchStatus()}
                disabled={isStatusLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => initializeBigQuery()}
                disabled={isInitializing || isStatusLoading}
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Initialize BigQuery
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Data to BigQuery</CardTitle>
              <CardDescription>
                Export your application data to BigQuery for analytics and reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertTitle>About Data Export</AlertTitle>
                <AlertDescription>
                  This will export all users, feedback, and analytics data to your BigQuery dataset.
                  The export process may take a few minutes depending on the amount of data.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-medium">Exported Data Types:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>User profiles and subscription information</li>
                  <li>User feedback submissions</li>
                  <li>System analytics and usage metrics</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => exportToBigQuery()}
                disabled={isExporting || !(statusData?.configured)}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting Data...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Export All Data
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>BigQuery Integration Documentation</CardTitle>
              <CardDescription>
                Learn how to use the BigQuery integration
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3>Getting Started</h3>
              <p>
                The BigQuery integration allows you to export your application data to Google BigQuery
                for advanced analytics, reporting, and data visualization.
              </p>

              <h3>Setup Instructions</h3>
              <ol>
                <li>Create a Google Cloud Platform (GCP) project</li>
                <li>Enable the BigQuery API in your GCP project</li>
                <li>Create a service account with BigQuery Admin permissions</li>
                <li>Download the service account key file (JSON format)</li>
                <li>Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of the key file</li>
                <li>Use the Initialize BigQuery button to create necessary resources</li>
              </ol>

              <h3>Running Exports</h3>
              <p>
                Once configured, you can manually trigger exports from the Export Data tab,
                or set up scheduled exports using a cron job or scheduled task.
              </p>

              <h3>Using BigQuery Studio</h3>
              <p>
                After data is exported, you can use BigQuery Studio in the GCP console to:
              </p>
              <ul>
                <li>Run SQL queries on your data</li>
                <li>Create visualizations and dashboards</li>
                <li>Set up scheduled queries</li>
                <li>Export data to other tools like Google Data Studio</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}