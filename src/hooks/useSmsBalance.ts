import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSmsBalance() {
  return useQuery({
    queryKey: ['sms-balance'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sms-balance');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
  });
}
