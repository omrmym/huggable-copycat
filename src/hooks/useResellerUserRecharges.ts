import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ResellerUserRecharge {
  id: string;
  reseller_id: string;
  radius_user_id: string;
  plan_id: string | null;
  amount: number;
  commission_amount: number;
  commission_rate: number;
  status: 'pending' | 'completed' | 'cancelled';
  description: string | null;
  created_at: string;
  resellers?: { name: string } | null;
  radius_users?: { username: string; full_name: string | null } | null;
  billing_plans?: { name: string } | null;
}

export function useResellerUserRecharges(resellerId?: string) {
  return useQuery({
    queryKey: ['reseller-user-recharges', resellerId],
    queryFn: async () => {
      let query = supabase
        .from('reseller_user_recharges')
        .select('*, resellers(name), radius_users(username, full_name), billing_plans(name)')
        .order('created_at', { ascending: false });
      
      if (resellerId) {
        query = query.eq('reseller_id', resellerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ResellerUserRecharge[];
    },
  });
}
