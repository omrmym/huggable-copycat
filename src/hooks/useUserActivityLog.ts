import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserActivityLog {
  id: string;
  action: 'connect' | 'disconnect';
  success: boolean;
  error_message: string | null;
  created_at: string; // The actual event time from MikroTik
  request_data: Record<string, unknown> | null;
  response_data: Record<string, unknown> | null;
}

export function useUserActivityLog(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-activity-log', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Only fetch connect/disconnect actions
      // connect = Last Link Up Time from MikroTik interface
      // disconnect = Last Logged Out time from MikroTik Secrets
      const { data, error } = await supabase
        .from('mikrotik_sync_log')
        .select('*')
        .eq('radius_user_id', userId)
        .in('action', ['connect', 'disconnect'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as UserActivityLog[];
    },
    enabled: !!userId,
  });
}
