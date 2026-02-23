import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionTimeoutDialog } from './SessionTimeoutDialog';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
import { useSessionTimeoutSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/contexts/AuthContext';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
}

// Inner component that uses session timeout - only rendered when user is authenticated
function SessionTimeoutManager() {
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  // Fetch settings from database
  const { data: settings } = useSessionTimeoutSettings();

  const timeoutMinutes = settings?.timeout_minutes ?? 30;
  const warningMinutes = settings?.warning_minutes ?? 5;

  const {
    showWarning,
    remainingTime,
    extendSession,
    logout,
  } = useSessionTimeout({
    timeoutMinutes,
    warningMinutes,
  });

  // Show toast when session is extended
  const handleExtend = () => {
    extendSession();
    toast({
      title: 'Session Extended',
      description: 'Your session has been extended successfully.',
    });
  };

  // Show toast when user logs out due to timeout
  const handleLogout = async () => {
    await logout();
    if (!hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: 'Session Expired',
        description: 'You have been logged out due to inactivity.',
        variant: 'destructive',
      });
    }
  };

  // Reset toast flag when warning shows
  useEffect(() => {
    if (showWarning) {
      hasShownToast.current = false;
    }
  }, [showWarning]);

  return (
    <SessionTimeoutDialog
      open={showWarning}
      remainingTime={remainingTime}
      onExtend={handleExtend}
      onLogout={handleLogout}
    />
  );
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const { user, isLoading } = useAuth();

  return (
    <>
      {children}
      {/* Only render session timeout manager when user is authenticated and not loading */}
      {!isLoading && user && <SessionTimeoutManager />}
    </>
  );
}
