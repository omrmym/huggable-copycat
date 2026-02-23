import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Package, UserX, Loader2, Save, AlertTriangle, Play, RefreshCw } from 'lucide-react';

type ExpirationBehavior = 'change_profile' | 'disable_user';

interface ExpirationSettings {
  behavior: ExpirationBehavior;
  expired_profile_name: string;
}

const DEFAULT_SETTINGS: ExpirationSettings = {
  behavior: 'disable_user',
  expired_profile_name: 'expired',
};

export function MikrotikExpirationSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ExpirationSettings>(DEFAULT_SETTINGS);

  // Fetch current settings
  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['mikrotik-expiration-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'mikrotik_expiration_behavior')
        .maybeSingle();

      if (error) throw error;
      if (!data?.value) return null;
      
      const value = data.value as Record<string, unknown>;
      return {
        behavior: (value.behavior as ExpirationBehavior) || DEFAULT_SETTINGS.behavior,
        expired_profile_name: (value.expired_profile_name as string) || DEFAULT_SETTINGS.expired_profile_name,
      };
    },
  });

  // Fetch count of expired users pending sync
  const { data: pendingExpiredCount = 0 } = useQuery({
    queryKey: ['pending-expired-users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('radius_users')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'expired')
        .eq('mikrotik_synced', false);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Load settings when data is fetched
  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, [savedSettings]);

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'mikrotik_expiration_behavior')
        .maybeSingle();

      const settingsValue = {
        behavior: settings.behavior,
        expired_profile_name: settings.expired_profile_name,
      };

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({
            value: settingsValue,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'mikrotik_expiration_behavior');

        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_settings').insert({
          key: 'mikrotik_expiration_behavior',
          value: settingsValue,
          description: 'Defines what happens to users on MikroTik when their subscription expires',
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mikrotik-expiration-settings'] });
      toast.success('Expiration settings saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  // Process expired users mutation
  const processExpiredUsers = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: { action: 'process-expired-users' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to process expired users');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-expired-users-count'] });
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      const result = data.data;
      if (result.processed === 0) {
        toast.info('No expired users to process');
      } else {
        toast.success(`Processed ${result.processed} users: ${result.succeeded} succeeded, ${result.failed} failed`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to process expired users: ${error.message}`);
    },
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          User Expiration Behavior
        </CardTitle>
        <CardDescription>
          Configure what happens on MikroTik when a user's subscription expires.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <RadioGroup
              value={settings.behavior}
              onValueChange={(value: ExpirationBehavior) =>
                setSettings((prev) => ({ ...prev, behavior: value }))
              }
              className="space-y-4"
            >
              {/* Option 1: Change to expired profile */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors">
                <RadioGroupItem value="change_profile" id="change_profile" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label
                    htmlFor="change_profile"
                    className="flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Package className="w-4 h-4 text-warning" />
                    Change to Expired Profile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    The user's MikroTik profile will change to an "expired" profile with restricted
                    access. They will be immediately removed from the active interface.
                  </p>
                  {settings.behavior === 'change_profile' && (
                    <div className="pt-2 space-y-2">
                      <Label htmlFor="expired_profile_name" className="text-sm">
                        Expired Profile Name
                      </Label>
                      <Input
                        id="expired_profile_name"
                        placeholder="expired"
                        value={settings.expired_profile_name}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            expired_profile_name: e.target.value,
                          }))
                        }
                        className="max-w-xs bg-background border-border"
                      />
                      <p className="text-xs text-muted-foreground">
                        This profile must exist on your MikroTik router (Hotspot/PPP profiles).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Option 2: Disable user */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors">
                <RadioGroupItem value="disable_user" id="disable_user" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label
                    htmlFor="disable_user"
                    className="flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <UserX className="w-4 h-4 text-destructive" />
                    Disable User on MikroTik
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    The user ID will be disabled on MikroTik, blocking all access. They will be
                    immediately removed from the active interface.
                  </p>
                </div>
              </div>
            </RadioGroup>

            {/* Process Expired Users Action */}
            <div className="p-4 rounded-lg border border-border bg-secondary/30">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Process Expired Users</p>
                  <p className="text-xs text-muted-foreground">
                    Apply the selected expiration behavior to all expired users on MikroTik.
                    {pendingExpiredCount > 0 && (
                      <span className="ml-1 text-warning font-medium">
                        ({pendingExpiredCount} pending)
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => processExpiredUsers.mutate()}
                  disabled={processExpiredUsers.isPending}
                  className="shrink-0"
                >
                  {processExpiredUsers.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Process Now
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-warning">Important</p>
                <p className="text-xs text-muted-foreground">
                  When a user's subscription expires, they are marked as "expired" in the database.
                  Click "Process Now" to apply the configured behavior to MikroTik, or set up an
                  automated schedule using your server's cron system.
                </p>
              </div>
            </div>

            <Button
              onClick={() => saveSettings.mutate()}
              disabled={saveSettings.isPending}
              className="w-full bg-gradient-primary text-primary-foreground"
            >
              {saveSettings.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Expiration Settings
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
