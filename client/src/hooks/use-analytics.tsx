import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './use-auth';

export function useAnalytics() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Analytics tracking has been completely removed
  useEffect(() => {
    // No-op
  }, [location, user]);

  return {
    trackAction: async () => {
      // No-op
    }
  };
}