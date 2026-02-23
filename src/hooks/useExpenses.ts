import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSystemActivity } from '@/hooks/useSystemActivity';

export interface Expense {
  id: string;
  amount: number;
  description: string | null;
  category: string | null;
  added_by: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFormData {
  amount: number;
  description?: string;
  category?: string;
  added_by?: string;
  date: string;
}

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: ExpenseFormData) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      logSystemActivity({
        action: 'create',
        entityType: 'expense',
        entityId: data.id,
        entityName: variables.category || 'Expense',
        details: { amount: variables.amount },
      });
      toast.success('Expense added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add expense: ${error.message}`);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...expense }: ExpenseFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(expense)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      logSystemActivity({
        action: 'update',
        entityType: 'expense',
        entityId: data.id,
        entityName: data.category || 'Expense',
        details: { amount: data.amount },
      });
      toast.success('Expense updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update expense: ${error.message}`);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      logSystemActivity({
        action: 'delete',
        entityType: 'expense',
        entityId: deletedId,
      });
      toast.success('Expense deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete expense: ${error.message}`);
    },
  });
}
