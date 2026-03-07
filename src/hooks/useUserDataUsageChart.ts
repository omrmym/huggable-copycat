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
          expires_at,
          plan_id,
          billing_plans (
            name,
            data_limit_mb,
            duration_days
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
          cycleStart: null,
          cycleEnd: null,
          durationDays: null,
        };
      }

      const dataUsedMb = user.data_used_mb || 0;
      const plan = user.billing_plans as { name: string; data_limit_mb: number | null; duration_days: number | null } | null;
      const dataLimitMb = plan?.data_limit_mb || null;
      const planName = plan?.name || null;
      const durationDays = plan?.duration_days || 30;

      // Calculate billing cycle period
      let cycleStart: string | null = null;
      let cycleEnd: string | null = null;

      if (user.expires_at) {
        const expiresAt = new Date(user.expires_at);
        const startDate = new Date(expiresAt);
        startDate.setDate(startDate.getDate() - durationDays);
        cycleStart = startDate.toISOString();
        cycleEnd = expiresAt.toISOString();
      }

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
        cycleStart,
        cycleEnd,
        durationDays,
      };
    },
    enabled: !!userId,
    refetchInterval: 10000, // Refetch every 10 seconds for "live" updates
  });
}
