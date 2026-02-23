import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMikrotikRouters } from '@/hooks/useMikrotikRouters';
import { Loader2, ArrowRightLeft } from 'lucide-react';

interface BulkTransferRouterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  currentRouterIds: string[];
  onTransfer: (targetRouterId: string) => Promise<void>;
  isTransferring: boolean;
}

export function BulkTransferRouterDialog({
  open,
  onOpenChange,
  selectedCount,
  currentRouterIds,
  onTransfer,
  isTransferring,
}: BulkTransferRouterDialogProps) {
  const [targetRouterId, setTargetRouterId] = useState<string>('');
  const { data: routers = [], isLoading: routersLoading } = useMikrotikRouters();

  // Filter out routers that ALL selected users are already on
  const uniqueCurrentRouterIds = [...new Set(currentRouterIds.filter(Boolean))];
  const availableRouters = routers.filter(
    (router) => !uniqueCurrentRouterIds.includes(router.id) || uniqueCurrentRouterIds.length > 1
  );

  const handleTransfer = async () => {
    if (!targetRouterId) return;
    await onTransfer(targetRouterId);
    setTargetRouterId('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTargetRouterId('');
    }
    onOpenChange(newOpen);
  };

  const selectedRouter = routers.find((r) => r.id === targetRouterId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Transfer Users to Router
          </DialogTitle>
          <DialogDescription>
            Transfer {selectedCount} selected user{selectedCount > 1 ? 's' : ''} to a different
            MikroTik router. Users will be removed from their current router and added to the new
            one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="target-router">Target Router</Label>
            {routersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading routers...
              </div>
            ) : availableRouters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No other routers available. Add more routers in Settings.
              </p>
            ) : (
              <Select value={targetRouterId} onValueChange={setTargetRouterId}>
                <SelectTrigger id="target-router">
                  <SelectValue placeholder="Select target router" />
                </SelectTrigger>
                <SelectContent>
                  {routers.map((router) => (
                    <SelectItem key={router.id} value={router.id}>
                      {router.name} ({router.host}:{router.port})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedRouter && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{selectedRouter.name}</p>
              <p className="text-muted-foreground">
                {selectedRouter.host}:{selectedRouter.port} • {selectedRouter.connection_mode.toUpperCase()}
                {selectedRouter.use_ssl ? ' (SSL)' : ''}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isTransferring}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!targetRouterId || isTransferring || availableRouters.length === 0}
          >
            {isTransferring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transfer {selectedCount} User{selectedCount > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
