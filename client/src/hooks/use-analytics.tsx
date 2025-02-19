import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './use-auth';

export function useAnalytics() {
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/track-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            path: location,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [location, user]);

  const trackAction = async (action: string, metadata?: Record<string, any>) => {
    if (!user) return;

    try {
      await fetch('/api/analytics/track-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action,
          metadata,
        }),
      });
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  };

  return { trackAction };
}
