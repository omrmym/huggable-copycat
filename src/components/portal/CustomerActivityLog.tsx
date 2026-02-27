import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Wifi, WifiOff } from 'lucide-react';
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
        .in('action', ['connect', 'disconnect'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SyncLogEntry[];
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Log
        </CardTitle>
        <CardDescription>Your connection and disconnection history</CardDescription>
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
            {logs.map((log) => {
              const isConnect = log.action === 'connect';
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isConnect ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}>
                      {isConnect 
                        ? <Wifi className="w-4 h-4 text-green-500" /> 
                        : <WifiOff className="w-4 h-4 text-yellow-500" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {isConnect ? 'Connected' : 'Disconnected'}
                      </p>
                      {log.error_message && (
                        <p className="text-xs text-destructive">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={isConnect 
                        ? 'border-green-500/30 text-green-500' 
                        : 'border-yellow-500/30 text-yellow-500'
                      }
                    >
                      {isConnect ? 'Online' : 'Offline'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTimeShort(log.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No connection activity recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
