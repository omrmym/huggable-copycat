import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, ShieldOff, Lock, Unlock, Loader2, Wifi, Edit2, Check, X, Scan } from 'lucide-react';

interface MacLockControlProps {
  userId: string;
  username: string;
  macAddress: string | null;
  macLocked: boolean;
  serviceType: 'hotspot' | 'pppoe';
  routerId: string | null;
  detectedMac?: string | null;
  isOnline?: boolean;
}

export function MacLockControl({
  userId,
  username,
  macAddress,
  macLocked,
  serviceType,
  routerId,
  detectedMac,
  isOnline,
}: MacLockControlProps) {
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'lock' | 'unlock' | null>(null);
  const [isEditingMac, setIsEditingMac] = useState(false);
  const [editedMac, setEditedMac] = useState(macAddress || '');

  // Update editedMac when macAddress prop changes
  useEffect(() => {
    if (!isEditingMac) {
      setEditedMac(macAddress || '');
    }
  }, [macAddress, isEditingMac]);

  // Update MAC address mutation
  const updateMacMutation = useMutation({
    mutationFn: async (newMac: string) => {
      const { error } = await supabase
        .from('radius_users')
        .update({ mac_address: newMac || null })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      toast.success('MAC address updated');
      setIsEditingMac(false);
    },
    onError: (error) => {
      toast.error(`Failed to update MAC: ${error.message}`);
    },
  });

  // Toggle MAC lock mutation
  const toggleMacLockMutation = useMutation({
    mutationFn: async ({ lock, syncToRouter }: { lock: boolean; syncToRouter: boolean }) => {
      // First get the user's password and plan profile from the database
      const { data: userData, error: userError } = await supabase
        .from('radius_users')
        .select('password_hash, plan_id, billing_plans(name)')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Update database
      const { error } = await supabase
        .from('radius_users')
        .update({ mac_locked: lock })
        .eq('id', userId);

      if (error) throw error;

      // Sync to MikroTik if requested
      if (syncToRouter && routerId) {
        const routerData = await supabase
          .from('mikrotik_routers')
          .select('host, port, username, password, use_ssl, connection_mode')
          .eq('id', routerId)
          .eq('is_active', true)
          .maybeSingle();

        if (routerData.data) {
          // Get profile name from billing plan
          const planData = userData?.billing_plans as { name: string } | null;
          const profileName = planData?.name || 'default';

          const { data: syncResult } = await supabase.functions.invoke('mikrotik-sync', {
            body: {
              action: 'set-mac-binding',
              username,
              service_type: serviceType,
              mac_address: lock ? macAddress : null,
              password: userData?.password_hash, // Pass password to create secret if needed
              profile: profileName, // Pass profile name
              router: {
                host: routerData.data.host,
                port: routerData.data.port,
                username: routerData.data.username,
                password: routerData.data.password,
                useSsl: routerData.data.use_ssl,
                connectionMode: routerData.data.connection_mode,
              },
            },
          });

          if (!syncResult?.success) {
            console.warn('MikroTik sync error:', syncResult?.error);
            toast.error(`MikroTik sync failed: ${syncResult?.error}`);
            throw new Error(syncResult?.error || 'MikroTik sync failed');
          } else {
            console.log('MikroTik sync success');
          }
        }
      }

      return { lock };
    },
    onSuccess: ({ lock }) => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      toast.success(lock ? 'MAC address locked and synced to router' : 'MAC address unlocked');
      setShowConfirmDialog(false);
      setPendingAction(null);
    },
    onError: (error) => {
      toast.error(`Failed to ${pendingAction} MAC: ${error.message}`);
      setShowConfirmDialog(false);
      setPendingAction(null);
    },
  });

  // Auto MAC Lock mutation - detects MAC from active session and locks
  const autoMacLockMutation = useMutation({
    mutationFn: async () => {
      if (!routerId) throw new Error('No router assigned to this user');

      const routerData = await supabase
        .from('mikrotik_routers')
        .select('host, port, username, password, use_ssl, connection_mode')
        .eq('id', routerId)
        .eq('is_active', true)
        .maybeSingle();

      if (!routerData.data) throw new Error('Router not found or inactive');

      const { data: syncResult } = await supabase.functions.invoke('mikrotik-sync', {
        body: {
          action: 'auto-mac-binding',
          username,
          router: {
            host: routerData.data.host,
            port: routerData.data.port,
            username: routerData.data.username,
            password: routerData.data.password,
            useSsl: routerData.data.use_ssl,
            connectionMode: routerData.data.connection_mode,
          },
        },
      });

      if (!syncResult?.success) {
        throw new Error(syncResult?.error || 'Failed to auto-detect MAC');
      }

      return syncResult.data;
    },
    onSuccess: (data: { mac: string; message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      toast.success(`MAC auto-locked: ${data.mac}`);
    },
    onError: (error) => {
      toast.error(`Auto MAC lock failed: ${error.message}`);
    },
  });

  const handleToggleLock = (action: 'lock' | 'unlock') => {
    if (action === 'lock' && !macAddress) {
      toast.error('Please set a MAC address first before locking');
      return;
    }
    setPendingAction(action);
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    toggleMacLockMutation.mutate({
      lock: pendingAction === 'lock',
      syncToRouter: !!routerId,
    });
  };

  const handleSaveMac = () => {
    const cleanedMac = editedMac.trim().toUpperCase();
    // Basic MAC validation
    const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i;
    if (cleanedMac && !macRegex.test(cleanedMac)) {
      toast.error('Invalid MAC address format. Use XX:XX:XX:XX:XX:XX');
      return;
    }
    updateMacMutation.mutate(cleanedMac);
  };

  const handleCancelEdit = () => {
    setEditedMac(macAddress || '');
    setIsEditingMac(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              MAC Address Control
            </CardTitle>
            <Badge
              variant={macLocked ? 'default' : 'secondary'}
              className={macLocked ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
            >
              {macLocked ? (
                <>
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 mr-1" />
                  Unlocked
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* MAC Address Display/Edit */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">MAC Address</Label>
            {isEditingMac ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedMac}
                  onChange={(e) => setEditedMac(e.target.value)}
                  placeholder="XX:XX:XX:XX:XX:XX"
                  className="font-mono uppercase"
                  disabled={updateMacMutation.isPending}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveMac}
                  disabled={updateMacMutation.isPending}
                  className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                >
                  {updateMacMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={updateMacMutation.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-foreground">
                    {macAddress || 'Not set'}
                  </span>
                </div>
                {/* Auto-detect button */}
                {detectedMac && isOnline && detectedMac !== macAddress && !macLocked && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditedMac(detectedMac);
                      setIsEditingMac(true);
                    }}
                    className="border-primary text-primary hover:bg-primary/10"
                    title="Use detected MAC from active session"
                  >
                    <Scan className="w-4 h-4 mr-1" />
                    Auto-detect
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditedMac(macAddress || '');
                    setIsEditingMac(true);
                  }}
                  disabled={macLocked}
                  title={macLocked ? 'Unlock MAC to edit' : 'Edit MAC address'}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Lock Status Info */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm text-muted-foreground">
              {macLocked ? (
                <>
                  <Shield className="w-4 h-4 inline mr-1 text-green-500" />
                  This user can only connect from the registered MAC address. 
                  Unauthorized devices will be blocked.
                </>
              ) : (
                <>
                  <ShieldOff className="w-4 h-4 inline mr-1 text-muted-foreground" />
                  MAC binding is disabled. The user can connect from any device.
                </>
              )}
            </p>
          </div>

          {/* Lock/Unlock Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${macLocked ? 'bg-green-500/20' : 'bg-muted'}`}>
                {macLocked ? (
                  <Lock className="w-5 h-5 text-green-500" />
                ) : (
                  <Unlock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">MAC Lock</p>
                <p className="text-sm text-muted-foreground">
                  {macLocked ? 'Connection restricted to registered MAC' : 'Allow any device'}
                </p>
              </div>
            </div>
            <Switch
              checked={macLocked}
              onCheckedChange={(checked) => handleToggleLock(checked ? 'lock' : 'unlock')}
              disabled={toggleMacLockMutation.isPending || (!macAddress && !macLocked)}
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2">
            {macLocked ? (
              <Button
                variant="outline"
                className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => handleToggleLock('unlock')}
                disabled={toggleMacLockMutation.isPending}
              >
                {toggleMacLockMutation.isPending && pendingAction === 'unlock' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4 mr-2" />
                )}
                Unlock MAC
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
                onClick={() => handleToggleLock('lock')}
                disabled={toggleMacLockMutation.isPending || !macAddress}
              >
                {toggleMacLockMutation.isPending && pendingAction === 'lock' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Lock MAC
              </Button>
            )}
          </div>

          {!macAddress && !macLocked && (
            <p className="text-xs text-muted-foreground text-center">
              Set a MAC address to enable MAC locking
            </p>
          )}

          {/* Auto MAC Lock - detects MAC from online session */}
          {isOnline && !macLocked && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Scan className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Auto MAC Lock</p>
                    <p className="text-sm text-muted-foreground">
                      Detect MAC from active session & lock automatically
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => autoMacLockMutation.mutate()}
                  disabled={autoMacLockMutation.isPending}
                  className="bg-primary text-primary-foreground"
                >
                  {autoMacLockMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 mr-1" />
                  )}
                  Auto Lock
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === 'lock' ? 'Lock MAC Address?' : 'Unlock MAC Address?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'lock' ? (
                <>
                  This will restrict <strong>{username}</strong> to only connect from MAC address{' '}
                  <code className="bg-muted px-1 rounded">{macAddress}</code>.
                  {routerId && ' The change will be synced to the MikroTik router.'}
                </>
              ) : (
                <>
                  This will allow <strong>{username}</strong> to connect from any device.
                  {routerId && ' The MAC binding will be removed from the MikroTik router.'}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleMacLockMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={toggleMacLockMutation.isPending}
              className={pendingAction === 'lock' ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              {toggleMacLockMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {pendingAction === 'lock' ? 'Lock MAC' : 'Unlock MAC'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
