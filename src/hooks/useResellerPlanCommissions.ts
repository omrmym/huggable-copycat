import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ResellerPlanCommission {
  id: string;
  reseller_id: string;
  plan_id: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  resellers?: { name: string } | null;
  billing_plans?: { name: string; price: number; service_type: string } | null;
}

export function useResellerPlanCommissions(resellerId?: string) {
  return useQuery({
    queryKey: ['reseller-plan-commissions', resellerId],
    queryFn: async () => {
      let query = supabase
        .from('reseller_plan_commissions')
        .select('*, resellers(name), billing_plans(name, price, service_type)')
        .order('created_at', { ascending: false });
      
      if (resellerId) {
        query = query.eq('reseller_id', resellerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ResellerPlanCommission[];
    },
  });
}

export function useCreateResellerPlanCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commission: Omit<ResellerPlanCommission, 'id' | 'created_at' | 'updated_at' | 'resellers' | 'billing_plans'>) => {
      const { data, error } = await supabase
        .from('reseller_plan_commissions')
        .insert(commission)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-plan-commissions'] });
      toast({ title: 'Success', description: 'Commission rate added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateResellerPlanCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ResellerPlanCommission> & { id: string }) => {
      const { data, error } = await supabase
        .from('reseller_plan_commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-plan-commissions'] });
      toast({ title: 'Success', description: 'Commission rate updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteResellerPlanCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reseller_plan_commissions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-plan-commissions'] });
      toast({ title: 'Success', description: 'Commission rate deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
