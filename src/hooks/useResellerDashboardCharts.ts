import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useResellerMonthlyBillCollection(resellerId: string | undefined, isSuperAdmin: boolean = false, sessionToken: string | null = null) {
  return useQuery({
    queryKey: ['reseller-monthly-bill-collection', resellerId, isSuperAdmin],
    queryFn: async () => {
      if (!resellerId && !isSuperAdmin) return [];
      
      const { data, error } = await supabase.functions.invoke('reseller-get-charts', {
        body: { resellerId, isSuperAdmin, chartType: 'monthly-bill-collection', session_token: sessionToken },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch chart data');

      return data.data as { month: string; amount: number }[];
    },
    enabled: (!!resellerId || isSuperAdmin) && !!sessionToken,
  });
}

export function useResellerDailyBillCollection(resellerId: string | undefined, isSuperAdmin: boolean = false, sessionToken: string | null = null) {
  return useQuery({
    queryKey: ['reseller-daily-bill-collection', resellerId, isSuperAdmin],
    queryFn: async () => {
      if (!resellerId && !isSuperAdmin) return [];
      
      const { data, error } = await supabase.functions.invoke('reseller-get-charts', {
        body: { resellerId, isSuperAdmin, chartType: 'daily-bill-collection', session_token: sessionToken },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch chart data');

      return data.data as { day: string; amount: number }[];
    },
    enabled: (!!resellerId || isSuperAdmin) && !!sessionToken,
  });
}

export function useResellerMonthlyPaidUsers(resellerId: string | undefined, isSuperAdmin: boolean = false, sessionToken: string | null = null) {
  return useQuery({
    queryKey: ['reseller-monthly-paid-users', resellerId, isSuperAdmin],
    queryFn: async () => {
      if (!resellerId && !isSuperAdmin) return [];
      
      const { data, error } = await supabase.functions.invoke('reseller-get-charts', {
        body: { resellerId, isSuperAdmin, chartType: 'monthly-paid-users', session_token: sessionToken },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch chart data');

      return data.data as { month: string; users: number }[];
    },
    enabled: (!!resellerId || isSuperAdmin) && !!sessionToken,
  });
}

export function useResellerDailyNewUsers(resellerId: string | undefined, isSuperAdmin: boolean = false, sessionToken: string | null = null) {
  return useQuery({
    queryKey: ['reseller-daily-new-users', resellerId, isSuperAdmin],
    queryFn: async () => {
      if (!resellerId && !isSuperAdmin) return [];
      
      const { data, error } = await supabase.functions.invoke('reseller-get-charts', {
        body: { resellerId, isSuperAdmin, chartType: 'daily-new-users', session_token: sessionToken },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch chart data');

      return data.data as { day: string; users: number }[];
    },
    enabled: (!!resellerId || isSuperAdmin) && !!sessionToken,
  });
}

export function useResellerUserStatusData(resellerId: string | undefined, isSuperAdmin: boolean = false, sessionToken: string | null = null) {
  return useQuery({
    queryKey: ['reseller-user-status', resellerId, isSuperAdmin],
    queryFn: async () => {
      if (!resellerId && !isSuperAdmin) return { totalUsers: 0, activeUsers: 0, expiredUsers: 0, disabledUsers: 0 };
      
      const { data, error } = await supabase.functions.invoke('reseller-get-charts', {
        body: { resellerId, isSuperAdmin, chartType: 'user-status', session_token: sessionToken },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch chart data');

      return data.data[0] as { totalUsers: number; activeUsers: number; expiredUsers: number; disabledUsers: number };
    },
    enabled: (!!resellerId || isSuperAdmin) && !!sessionToken,
    refetchInterval: 30000,
  });
}

export function useResellerOnlineUsers(resellerId: string | undefined, isSuperAdmin: boolean = false, sessionToken: string | null = null) {
  return useQuery({
    queryKey: ['reseller-online-users', resellerId, isSuperAdmin],
    queryFn: async (): Promise<{ onlineCount: number; onlineUsernames: string[]; totalUsers: number }> => {
      if (!resellerId && !isSuperAdmin) return { onlineCount: 0, onlineUsernames: [], totalUsers: 0 };
      
      const { data, error } = await supabase.functions.invoke('reseller-get-charts', {
        body: { resellerId, isSuperAdmin, chartType: 'online-users', session_token: sessionToken },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch online users data');

      return data.data as { onlineCount: number; onlineUsernames: string[]; totalUsers: number };
    },
    enabled: (!!resellerId || isSuperAdmin) && !!sessionToken,
    refetchInterval: 30000,
  });
}
