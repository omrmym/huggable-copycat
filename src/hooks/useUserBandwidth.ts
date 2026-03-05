import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BandwidthData {
  isOnline: boolean;
  uptime?: string;
  bytesIn: number;
  bytesOut: number;
  address?: string;
  callerId?: string;
  lastUpdated: Date;
}

interface RouterConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useSsl: boolean;
  connectionMode: string;
}

async function getRouterConfig(routerId: string | null): Promise<RouterConfig | null> {
  if (!routerId) return null;

  const { data, error } = await supabase
    .from('mikrotik_routers')
    .select('host, port, username, password, use_ssl, connection_mode')
    .eq('id', routerId)
    .eq('is_active', true)
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

export function useUserBandwidth(
  userId: string | undefined,
  username: string | undefined,
  serviceType: 'hotspot' | 'pppoe' | undefined,
  routerId: string | null | undefined
) {
  return useQuery({
    queryKey: ['user-bandwidth', userId, username],
    queryFn: async (): Promise<BandwidthData> => {
      if (!username || !serviceType) {
        return {
          isOnline: false,
          bytesIn: 0,
          bytesOut: 0,
          lastUpdated: new Date(),
        };
      }

      // Get router configuration
      const router = await getRouterConfig(routerId || null);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: {
          action: 'get-user-bandwidth',
          username,
          service_type: serviceType,
          router,
          radius_user_id: userId, // Pass user ID for history tracking
        },
      });

      if (error) {
        console.error('Bandwidth fetch error:', error);
        return {
          isOnline: false,
          bytesIn: 0,
          bytesOut: 0,
          lastUpdated: new Date(),
        };
      }

      if (!data.success) {
        console.error('Bandwidth API error:', data.error);
        return {
          isOnline: false,
          bytesIn: 0,
          bytesOut: 0,
          lastUpdated: new Date(),
        };
      }

      // Parse raw MikroTik active session data
      const sessions = Array.isArray(data.data) ? data.data : [];
      const session = sessions.length > 0 ? sessions[0] : null;

      if (!session) {
        return {
          isOnline: false,
          bytesIn: 0,
          bytesOut: 0,
          lastUpdated: new Date(),
        };
      }

      return {
        isOnline: true,
        uptime: session.uptime || undefined,
        bytesIn: parseInt(session['bytes-out'] || '0', 10),
        bytesOut: parseInt(session['bytes-in'] || '0', 10),
        address: session.address || undefined,
        callerId: session['mac-address'] || undefined,
        lastUpdated: new Date(),
      };
    },
    enabled: !!userId && !!username && !!serviceType,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 3000,
  });
}
