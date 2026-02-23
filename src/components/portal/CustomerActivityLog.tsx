import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Wifi, WifiOff, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { formatDateTimeShort } from '@/lib/dateUtils';

interface CustomerActivityLogProps {
  userId: string;
  username: string;
}

interface SyncLogEntry {
  id: string;
  action: string;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export function CustomerActivityLog({ userId, username }: CustomerActivityLogProps) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['customer-activity', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mikrotik_sync_log')
        .select('id, action, success, error_message, created_at')
        .eq('radius_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SyncLogEntry[];
    },
    enabled: !!userId,
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'connect':
      case 'login':
        return <LogIn className="w-4 h-4 text-green-500" />;
      case 'disconnect':
      case 'logout':
        return <LogOut className="w-4 h-4 text-yellow-500" />;
      case 'sync':
      case 'create-user':
      case 'update-user':
        return <RefreshCw className="w-4 h-4 text-primary" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'connect': 'Connected',
      'disconnect': 'Disconnected',
      'login': 'Logged In',
      'logout': 'Logged Out',
      'sync': 'Account Synced',
      'create-user': 'Account Created',
      'update-user': 'Account Updated',
      'get-user-bandwidth': 'Bandwidth Check',
      'set-mac-binding': 'MAC Binding Updated',
    };
    return labels[action] || action;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Log
        </CardTitle>
        <CardDescription>Your recent account activities and connection history</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    log.success ? 'bg-green-500/20' : 'bg-destructive/20'
                  }`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {getActionLabel(log.action)}
                    </p>
                    {log.error_message && (
                      <p className="text-xs text-destructive">{log.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className={log.success ? 'border-green-500/30 text-green-500' : 'border-destructive/30 text-destructive'}
                  >
                    {log.success ? 'Success' : 'Failed'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTimeShort(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No activity recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
