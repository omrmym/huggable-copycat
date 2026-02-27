import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Shield, Lock, Unlock, Loader2, Wifi, Scan } from 'lucide-react';

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
}: MacLockControlProps) {
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'lock' | 'unlock' | null>(null);

  // Update MAC address mutation
  // Toggle MAC lock mutation
  const toggleMacLockMutation = useMutation({
    mutationFn: async ({ lock, syncToRouter }: { lock: boolean; syncToRouter: boolean }) => {
      // Update database - when unlocking, also clear mac_address
      const updateData: Record<string, unknown> = { mac_locked: lock };
      if (!lock) {
        updateData.mac_address = null;
      }

      const { error } = await supabase
        .from('radius_users')
        .update(updateData)
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
          const { data: syncResult } = await supabase.functions.invoke('mikrotik-sync', {
            body: {
              action: 'set-mac-binding',
              username,
              service_type: serviceType,
              mac_address: lock ? macAddress : '',
              locked: lock,
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
            toast.error(`মাইক্রোটিক সিঙ্ক ব্যর্থ: ${syncResult?.error}`);
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
      toast.success(lock ? 'MAC অ্যাড্রেস লক করা হয়েছে এবং রাউটারে সিঙ্ক হয়েছে' : 'MAC অ্যাড্রেস আনলক করা হয়েছে');
      setShowConfirmDialog(false);
      setPendingAction(null);
    },
    onError: (error) => {
      toast.error(`MAC ${pendingAction === 'lock' ? 'লক' : 'আনলক'} করতে ব্যর্থ: ${error.message}`);
      setShowConfirmDialog(false);
      setPendingAction(null);
    },
  });

  // Auto MAC Lock mutation - detects MAC from active session and locks
  const autoMacLockMutation = useMutation({
    mutationFn: async () => {
      if (!routerId) throw new Error('এই ইউজারের জন্য কোনো রাউটার অ্যাসাইন করা নেই');

      const routerData = await supabase
        .from('mikrotik_routers')
        .select('host, port, username, password, use_ssl, connection_mode')
        .eq('id', routerId)
        .eq('is_active', true)
        .maybeSingle();

      if (!routerData.data) throw new Error('রাউটার পাওয়া যায়নি বা নিষ্ক্রিয়');

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
        throw new Error(syncResult?.error || 'MAC স্বয়ংক্রিয়ভাবে সনাক্ত করতে ব্যর্থ');
      }

      return syncResult.data;
    },
    onSuccess: (data: { mac: string; message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      toast.success(`MAC অটো-লক সফল: ${data.mac}`);
    },
    onError: (error) => {
      toast.error(`অটো MAC লক ব্যর্থ: ${error.message}`);
    },
  });

  const handleToggleLock = (action: 'lock' | 'unlock') => {
    if (action === 'lock' && !macAddress) {
      toast.error('লক করার আগে প্রথমে একটি MAC অ্যাড্রেস সেট করুন');
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

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
               <Shield className="w-5 h-5 text-primary" />
               MAC অ্যাড্রেস কন্ট্রোল
             </CardTitle>
             <Badge
               variant={macLocked ? 'default' : 'secondary'}
               className={macLocked ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
             >
               {macLocked ? (
                 <>
                   <Lock className="w-3 h-3 mr-1" />
                   লক করা
                 </>
               ) : (
                 <>
                   <Unlock className="w-3 h-3 mr-1" />
                   আনলক
                 </>
               )}
             </Badge>
           </div>
         </CardHeader>
         <CardContent className="space-y-4">
           {/* MAC Address Display */}
           <div className="space-y-2">
             <Label className="text-sm text-muted-foreground">MAC অ্যাড্রেস</Label>
             <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
               <Wifi className="w-4 h-4 text-muted-foreground" />
               <span className="font-mono text-foreground">
                 {macAddress || 'সেট করা হয়নি'}
               </span>
             </div>
           </div>

           {/* Auto MAC Lock - always available for admin */}
           <div className={`p-4 rounded-lg border ${macLocked ? 'border-green-500/30 bg-green-500/5' : 'border-primary/30 bg-primary/5'}`}>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${macLocked ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                   <Scan className={`w-5 h-5 ${macLocked ? 'text-green-500' : 'text-primary'}`} />
                 </div>
                 <div>
                   <p className="font-medium text-foreground">অটো MAC লক</p>
                   <p className="text-sm text-muted-foreground">
                       {macLocked
                         ? 'MAC লক করা আছে। রাউটার থেকে MAC সরাতে আনলক ক্লিক করুন।'
                         : 'মাইক্রোটিক অ্যাক্টিভ সেশন থেকে MAC সনাক্ত ও বাইন্ড করতে অটো লক ক্লিক করুন।'}
                    </p>
                  </div>
                </div>
                {macLocked ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleLock('unlock')}
                    disabled={toggleMacLockMutation.isPending}
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    {toggleMacLockMutation.isPending && pendingAction === 'unlock' ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Unlock className="w-4 h-4 mr-1" />
                    )}
                    আনলক
                  </Button>
                ) : (
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
                   অটো লক
                 </Button>
               )}
             </div>
           </div>
         </CardContent>
       </Card>

       {/* Confirmation Dialog */}
       <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>
               {pendingAction === 'lock' ? 'MAC অ্যাড্রেস লক করবেন?' : 'MAC অ্যাড্রেস আনলক করবেন?'}
             </AlertDialogTitle>
             <AlertDialogDescription>
               {pendingAction === 'lock' ? (
                 <>
                   এটি <strong>{username}</strong> কে শুধুমাত্র MAC অ্যাড্রেস{' '}
                   <code className="bg-muted px-1 rounded">{macAddress}</code> থেকে সংযোগ করতে সীমাবদ্ধ করবে।
                   {routerId && ' পরিবর্তনটি মাইক্রোটিক রাউটারে সিঙ্ক হবে।'}
                 </>
               ) : (
                 <>
                   এটি <strong>{username}</strong> কে যেকোনো ডিভাইস থেকে সংযোগ করতে অনুমতি দেবে।
                   {routerId && ' মাইক্রোটিক রাউটার থেকে MAC বাইন্ডিং সরানো হবে।'}
                 </>
               )}
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={toggleMacLockMutation.isPending}>
               বাতিল
             </AlertDialogCancel>
             <AlertDialogAction
               onClick={confirmAction}
               disabled={toggleMacLockMutation.isPending}
               className={pendingAction === 'lock' ? 'bg-green-500 hover:bg-green-600' : ''}
             >
               {toggleMacLockMutation.isPending && (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               )}
               {pendingAction === 'lock' ? 'MAC লক করুন' : 'MAC আনলক করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
