import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, LogOut } from 'lucide-react';

interface SessionTimeoutDialogProps {
  open: boolean;
  remainingTime: string;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutDialog({
  open,
  remainingTime,
  onExtend,
  onLogout,
}: SessionTimeoutDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <AlertDialogTitle className="text-xl">Session Expiring Soon</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Your session will expire due to inactivity. You will be automatically logged out in{' '}
            <span className="font-bold text-warning">{remainingTime}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <p className="text-sm text-muted-foreground">
            For security purposes, inactive sessions are automatically terminated. 
            Click "Stay Logged In" to continue your session.
          </p>
        </div>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={onExtend} className="gap-2">
            <Clock className="w-4 h-4" />
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
