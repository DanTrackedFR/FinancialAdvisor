import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './use-auth';

export function useAnalytics() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Analytics tracking has been disabled
  useEffect(() => {
    // No-op - analytics tracking disabled
  }, [location, user]);

  const trackAction = async (_action: string, _metadata?: Record<string, any>) => {
    // No-op - analytics tracking disabled
  };

  return { trackAction };
}