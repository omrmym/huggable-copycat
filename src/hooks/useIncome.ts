import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSystemActivity } from '@/hooks/useSystemActivity';

export interface Income {
  id: string;
  amount: number;
  description: string | null;
  category: string | null;
  added_by: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface IncomeFormData {
  amount: number;
  description?: string;
  category?: string;
  added_by?: string;
  date: string;
}

export function useIncome() {
  return useQuery({
    queryKey: ['income'],
    queryFn: async (): Promise<Income[]> => {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (income: IncomeFormData) => {
      const { data, error } = await supabase
        .from('income')
        .insert([income])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      logSystemActivity({
        action: 'create',
        entityType: 'income',
        entityId: data.id,
        entityName: variables.category || 'Income',
        details: { amount: variables.amount },
      });
      toast.success('Income added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add income: ${error.message}`);
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...income }: IncomeFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('income')
        .update(income)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      logSystemActivity({
        action: 'update',
        entityType: 'income',
        entityId: data.id,
        entityName: data.category || 'Income',
        details: { amount: data.amount },
      });
      toast.success('Income updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update income: ${error.message}`);
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      logSystemActivity({
        action: 'delete',
        entityType: 'income',
        entityId: deletedId,
      });
      toast.success('Income deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete income: ${error.message}`);
    },
  });
}
