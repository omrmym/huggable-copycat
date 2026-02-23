import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Unplug, Loader2 } from 'lucide-react';
import { useDeactivateMikrotikRouter } from '@/hooks/useMikrotikRouters';

interface DisconnectRouterButtonProps {
  routerId: string;
}

export function DisconnectRouterButton({ routerId }: DisconnectRouterButtonProps) {
  const [open, setOpen] = useState(false);
  const deactivateRouter = useDeactivateMikrotikRouter();

  const handleDisconnect = () => {
    deactivateRouter.mutate(routerId, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full"
        >
          <Unplug className="w-4 h-4 mr-2" />
          Disconnect Router
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Router?</AlertDialogTitle>
          <AlertDialogDescription>
            This will deactivate the router configuration. The software will no longer communicate with the MikroTik router until you reconfigure it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDisconnect}
            disabled={deactivateRouter.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deactivateRouter.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
