import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IncomeCategory {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useIncomeCategories() {
  return useQuery({
    queryKey: ['income_categories'],
    queryFn: async (): Promise<IncomeCategory[]> => {
      const { data, error } = await supabase
        .from('income_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateIncomeCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: { name: string; code?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('income_categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_categories'] });
      toast.success('Income category added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add category: ${error.message}`);
    },
  });
}

export function useUpdateIncomeCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...category }: { id: string; name?: string; code?: string; description?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('income_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_categories'] });
      toast.success('Income category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
}

export function useDeleteIncomeCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income_categories'] });
      toast.success('Income category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
}
