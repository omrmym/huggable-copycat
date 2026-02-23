import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type BillingPlan = Tables<'billing_plans'>;

export interface ResellerAssignedPlan extends BillingPlan {
  commission_rate: number;
}

export function useResellerAssignedPlans(resellerId: string | undefined) {
  return useQuery({
    queryKey: ['reseller-assigned-plans', resellerId],
    queryFn: async (): Promise<ResellerAssignedPlan[]> => {
      if (!resellerId) return [];

      // Fetch active plan commissions for this reseller with plan details
      const { data: commissions, error } = await supabase
        .from('reseller_plan_commissions')
        .select(`
          commission_rate,
          billing_plans (*)
        `)
        .eq('reseller_id', resellerId)
        .eq('is_active', true);

      if (error) throw error;
      if (!commissions) return [];

      // Transform to include commission rate with plan data
      return commissions
        .filter((c) => c.billing_plans !== null)
        .map((c) => ({
          ...(c.billing_plans as BillingPlan),
          commission_rate: c.commission_rate,
        }));
    },
    enabled: !!resellerId,
  });
}
