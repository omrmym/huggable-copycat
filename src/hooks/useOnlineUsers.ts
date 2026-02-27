import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OnlineUsersData {
  onlineCount: number;
  onlineUsernames: string[];
}

interface RouterConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useSsl: boolean;
  connectionMode: string;
}

async function getFirstActiveRouter(): Promise<RouterConfig | null> {
  const { data, error } = await supabase
    .from('mikrotik_routers')
    .select('host, port, username, password, use_ssl, connection_mode')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    host: data.host,
    port: data.port || 8728,
    username: data.username,
    password: data.password,
    useSsl: data.use_ssl,
    connectionMode: data.connection_mode,
  };
}

export function useOnlineUsers() {
  return useQuery({
    queryKey: ['online-users'],
    queryFn: async (): Promise<OnlineUsersData> => {
      // Get router configuration
      const router = await getFirstActiveRouter();

      if (!router) {
        return { onlineCount: 0, onlineUsernames: [] };
      }

      // Call the edge function to get active sessions
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: {
          action: 'get-sessions',
          router,
        },
      });

      if (error) {
        console.error('Online users fetch error:', error);
        return { onlineCount: 0, onlineUsernames: [] };
      }

      if (!data.success) {
        console.error('Online users API error:', data.error);
        return { onlineCount: 0, onlineUsernames: [] };
      }

      // Extract usernames from active sessions
      const sessions = (data.data || []) as Array<{ name?: string; user?: string }>;
      const onlineUsernames = sessions
        .map(s => s.name || s.user || '')
        .filter(Boolean);

      return {
        onlineCount: onlineUsernames.length,
        onlineUsernames,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000,
  });
}
