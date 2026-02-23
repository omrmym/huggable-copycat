import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ResellerDashboardStats {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  disabledUsers: number;
  freeUsers: number;
  alreadyPaidUsers: number;
  totalBill: number;
  activeUsersBill: number;
  expiredUsersBill: number;
  alreadyPaidBill: number;
  totalConnectionFee: number;
  totalRecharges: number;
  totalCommission: number;
  autoRenewUsers: number;
  autoRenewBill: number;
}

export function useResellerDashboardStats(resellerId: string | undefined, isSuperAdmin: boolean = false, sessionToken: string | null = null) {
  return useQuery({
    queryKey: ['reseller-dashboard-stats', resellerId, isSuperAdmin],
    queryFn: async (): Promise<ResellerDashboardStats> => {
      if (!resellerId && !isSuperAdmin) {
        return {
          totalUsers: 0, activeUsers: 0, expiredUsers: 0, disabledUsers: 0,
          freeUsers: 0, alreadyPaidUsers: 0, totalBill: 0, activeUsersBill: 0,
          expiredUsersBill: 0, alreadyPaidBill: 0, totalConnectionFee: 0,
          totalRecharges: 0, totalCommission: 0, autoRenewUsers: 0, autoRenewBill: 0,
        };
      }

      const { data, error } = await supabase.functions.invoke('reseller-get-stats', {
        body: { resellerId, isSuperAdmin, session_token: sessionToken },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch stats');

      return data.stats;
    },
    enabled: (!!resellerId || isSuperAdmin) && !!sessionToken,
    refetchInterval: 30000,
  });
}
