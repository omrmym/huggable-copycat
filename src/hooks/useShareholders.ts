import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Shareholder {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  business_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useShareholders() {
  return useQuery({
    queryKey: ['shareholders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shareholders' as any)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Shareholder[];
    },
  });
}

export function useCreateShareholder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; phone?: string; email?: string; business_percent: number }) => {
      const { error } = await supabase
        .from('shareholders' as any)
        .insert(values as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
      toast.success('Shareholder added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateShareholder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; name?: string; phone?: string; email?: string; business_percent?: number; is_active?: boolean }) => {
      const { error } = await supabase
        .from('shareholders' as any)
        .update(values as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
      toast.success('Shareholder updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteShareholder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shareholders' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareholders'] });
      toast.success('Shareholder deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
