import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DataUsageChartData {
  label: string;
  value: number;
  color: string;
}

export interface UserDataUsage {
  dataUsedMb: number;
  dataLimitMb: number | null;
  percentageUsed: number;
  remainingMb: number | null;
  planName: string | null;
  cycleStart: string | null;
  cycleEnd: string | null;
  durationDays: number | null;
}

export function useUserDataUsageChart(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-data-usage-chart', userId],
    queryFn: async (): Promise<UserDataUsage> => {
      if (!userId) {
        return {
          dataUsedMb: 0,
          dataLimitMb: null,
          percentageUsed: 0,
          remainingMb: null,
          planName: null,
          cycleStart: null,
          cycleEnd: null,
          durationDays: null,
        };
      }

      // Fetch user with their plan details
      const { data: user, error } = await supabase
        .from('radius_users')
        .select(`
          data_used_mb,
          plan_id,
          billing_plans (
            name,
            data_limit_mb
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error || !user) {
        return {
          dataUsedMb: 0,
          dataLimitMb: null,
          percentageUsed: 0,
          remainingMb: null,
          planName: null,
        };
      }

      const dataUsedMb = user.data_used_mb || 0;
      const plan = user.billing_plans as { name: string; data_limit_mb: number | null } | null;
      const dataLimitMb = plan?.data_limit_mb || null;
      const planName = plan?.name || null;

      let percentageUsed = 0;
      let remainingMb: number | null = null;

      if (dataLimitMb && dataLimitMb > 0) {
        percentageUsed = Math.min((dataUsedMb / dataLimitMb) * 100, 100);
        remainingMb = Math.max(dataLimitMb - dataUsedMb, 0);
      }

      return {
        dataUsedMb,
        dataLimitMb,
        percentageUsed,
        remainingMb,
        planName,
      };
    },
    enabled: !!userId,
    refetchInterval: 10000, // Refetch every 10 seconds for "live" updates
  });
}
