import { useState } from 'react';
import { useExpirationTimeSettings } from '@/hooks/useAppSettings';
import { useUpdateRadiusUser } from '@/hooks/useRadiusUsers';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, AlertTriangle, Loader2, ShieldAlert, Info } from 'lucide-react';
import { toast } from 'sonner';
import { addDays } from 'date-fns';

interface GraceActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    username: string;
    grace_days_used: number;
  };
}

export function GraceActivationDialog({ 
  open, 
  onOpenChange, 
  user 
}: GraceActivationDialogProps) {
  const [graceDays, setGraceDays] = useState<string>('1');
  const updateUser = useUpdateRadiusUser();
  const { data: currentUserRole, isLoading: roleLoading } = useCurrentUserRole();
  const { data: expTimeSettings } = useExpirationTimeSettings();

  const isSuperAdmin = currentUserRole?.isSuperAdmin || false;
  const maxGraceDays = currentUserRole?.settings?.max_grace_days || 5;
  
  // Non-super_admin users can only use grace activation once per billing cycle
  const hasUsedGrace = user.grace_days_used > 0;
  const canActivate = isSuperAdmin || !hasUsedGrace;

  const parsedDays = parseInt(graceDays) || 0;
  const isValidDays = parsedDays >= 1 && parsedDays <= maxGraceDays;

  const handleActivate = async () => {
    if (!isValidDays || !canActivate) return;
    
    const days = parsedDays;
    const newExpiresAt = addDays(new Date(), days);
    // Set expiration to 09:00 AM
    newExpiresAt.setHours(9, 0, 0, 0);

    try {
      await updateUser.mutateAsync({
        id: user.id,
        status: 'active',
        expires_at: newExpiresAt.toISOString(),
        grace_days_used: user.grace_days_used + days,
        mikrotik_synced: false,
      });

      toast.success(`Line activated for ${days} day(s)`, {
        description: `${days} grace day(s) will be deducted from next billing cycle.`,
      });
      onOpenChange(false);
      setGraceDays('1');
    } catch (error) {
      toast.error('Failed to activate grace period');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Activate Grace Period
          </DialogTitle>
          <DialogDescription>
            Temporarily activate the line without generating a bill. These days will be deducted from the next billing cycle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Username</Label>
            <p className="text-sm font-mono text-muted-foreground">@{user.username}</p>
          </div>

          {/* Show warning if non-admin already used grace */}
          {!isSuperAdmin && hasUsedGrace && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Grace Already Used</p>
                <p className="text-muted-foreground">
                  This user has already used {user.grace_days_used} grace day(s) in this billing cycle.
                  Only Super Admin can activate grace multiple times.
                </p>
              </div>
            </div>
          )}

          {/* Show previous grace days warning if admin is adding more */}
          {isSuperAdmin && user.grace_days_used > 0 && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">Previous Grace Days</p>
                <p className="text-muted-foreground">
                  This user already has {user.grace_days_used} grace day(s) pending deduction.
                </p>
              </div>
            </div>
          )}

          {canActivate && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Enter Grace Days</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={maxGraceDays}
                    value={graceDays}
                    onChange={(e) => setGraceDays(e.target.value)}
                    className="w-24 text-center text-lg font-semibold"
                    placeholder="Days"
                  />
                  <span className="text-sm text-muted-foreground">day(s)</span>
                </div>
                {!isValidDays && graceDays !== '' && (
                  <p className="text-xs text-destructive">
                    Please enter a value between 1 and {maxGraceDays}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p>Your role allows up to <strong>{maxGraceDays} grace day(s)</strong> maximum.</p>
                  {isSuperAdmin && (
                    <p className="mt-1">As Super Admin, you can activate grace multiple times.</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Grace days to add:</span>
                  <span className="font-semibold">{parsedDays || 0} day(s)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total pending deduction:</span>
                  <span className="font-semibold text-warning">
                    {user.grace_days_used + (parsedDays || 0)} day(s)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                  ℹ️ No bill will be generated. Days will be deducted from the next recharge.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {canActivate && (
            <Button
              onClick={handleActivate}
              disabled={updateUser.isPending || !isValidDays || roleLoading}
              className="bg-gradient-primary text-primary-foreground"
            >
              {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Activate {parsedDays || 0} Day(s)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
