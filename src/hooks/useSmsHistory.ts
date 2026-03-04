import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SmsHistoryRecord {
  id: string;
  recipient_phone: string;
  recipient_name: string | null;
  message: string;
  sms_type: string;
  status: string;
  api_response: Record<string, unknown> | null;
  radius_user_id: string | null;
  sent_by: string | null;
  created_at: string;
}

export function useSmsHistory() {
  return useQuery({
    queryKey: ['sms-history'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sms_history' as any) as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as SmsHistoryRecord[];
    },
  });
}

export function useClearSmsHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from('sms_history' as any) as any)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-history'] });
    },
  });
}
