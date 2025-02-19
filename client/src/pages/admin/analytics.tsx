import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from "lucide-react";
import React from 'react';

export default function AnalyticsDashboard() {
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Fetch analytics data
  const { data: dailyUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/analytics/daily-users'],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      const response = await fetch(`/api/analytics/daily-users?start=${startDate.toISOString()}&end=${new Date().toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch daily users');
      return response.json();
    }
  });

  const { data: popularPages, isLoading: loadingPages } = useQuery({
    queryKey: ['/api/analytics/popular-pages'],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const response = await fetch(`/api/analytics/popular-pages?start=${startDate.toISOString()}&end=${new Date().toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch popular pages');
      return response.json();
    }
  });

  const { data: sessionDuration, isLoading: loadingDuration } = useQuery({
    queryKey: ['/api/analytics/session-duration'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/session-duration');
      if (!response.ok) throw new Error('Failed to fetch session duration');
      return response.json();
    }
  });

  const { data: recentActions, isLoading: loadingActions } = useQuery({
    queryKey: ['/api/analytics/recent-actions'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/recent-actions');
      if (!response.ok) throw new Error('Failed to fetch recent actions');
      return response.json();
    }
  });

  const isLoading = loadingUsers || loadingPages || loadingDuration || loadingActions;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Active Users */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Daily Active Users</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {loadingUsers ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyUsers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Popular Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Pages</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPages ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <div className="space-y-4">
                  {popularPages?.map((page: any) => (
                    <div key={page.path} className="flex justify-between items-center">
                      <span className="truncate">{page.path}</span>
                      <span className="font-medium">{page.views} views</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Average Session Duration */}
          <Card>
            <CardHeader>
              <CardTitle>Average Session Duration</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDuration ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <div className="text-4xl font-bold">
                  {Math.floor((sessionDuration || 0) / 60)} minutes
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Actions */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Recent User Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActions ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <div className="space-y-4">
                  {recentActions?.map((action: any) => (
                    <div key={action.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{action.action}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          by User {action.userId}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(action.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}