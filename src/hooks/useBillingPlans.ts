import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logSystemActivity } from '@/hooks/useSystemActivity';

type BillingPlan = Tables<'billing_plans'>;
type BillingPlanInsert = TablesInsert<'billing_plans'>;
type BillingPlanUpdate = TablesUpdate<'billing_plans'>;

export function useBillingPlans() {
  return useQuery({
    queryKey: ['billing-plans'],
    queryFn: async (): Promise<BillingPlan[]> => {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateBillingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: BillingPlanInsert) => {
      const { data, error } = await supabase
        .from('billing_plans')
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
      logSystemActivity({
        action: 'create',
        entityType: 'billing_plan',
        entityId: data.id,
        entityName: variables.name,
        details: { price: variables.price, type: variables.type },
      });
      toast.success('Plan created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create plan: ${error.message}`);
    },
  });
}

export function useUpdateBillingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: BillingPlanUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('billing_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
      logSystemActivity({
        action: 'update',
        entityType: 'billing_plan',
        entityId: data.id,
        entityName: data.name,
      });
      toast.success('Plan updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update plan: ${error.message}`);
    },
  });
}

export function useDeleteBillingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('billing_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
      logSystemActivity({
        action: 'delete',
        entityType: 'billing_plan',
        entityId: deletedId,
      });
      toast.success('Plan deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete plan: ${error.message}`);
    },
  });
}