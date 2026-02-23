import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay } from 'date-fns';

export interface PaymentChartData {
  day: string;
  amount: number;
  count: number;
}

export function useUserPaymentChart(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-payment-chart', userId],
    queryFn: async () => {
      if (!userId) return [];

      const days: PaymentChartData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const start = startOfDay(date);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        const { data } = await supabase
          .from('transactions')
          .select('amount')
          .eq('radius_user_id', userId)
          .eq('status', 'completed')
          .eq('type', 'payment')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        const total = data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const count = data?.length || 0;
        
        days.push({
          day: format(date, 'EEE'),
          amount: total,
          count,
        });
      }
      
      return days;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds for "live" updates
  });
}
