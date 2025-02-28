import { FC, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';

interface NotificationToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  duration?: number;
}

export const NotificationToast: FC<NotificationToastProps> = ({
  type,
  title,
  description,
  duration = 5000,
}) => {
  const { toast } = useToast();

  useEffect(() => {
    const toastOptions = {
      title,
      description,
      variant: type === 'error' ? 'destructive' as const : 'default' as const,
      duration,
    };

    // Add custom styling instead of using the icon property
    toast(toastOptions);

  }, [toast, type, title, description, duration]);

  return null;
};

export default NotificationToast;