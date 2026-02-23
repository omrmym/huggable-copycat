import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConnectivityType {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useConnectivityTypes() {
  return useQuery({
    queryKey: ['connectivity-types'],
    queryFn: async (): Promise<ConnectivityType[]> => {
      const { data, error } = await supabase
        .from('connectivity_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllConnectivityTypes() {
  return useQuery({
    queryKey: ['connectivity-types', 'all'],
    queryFn: async (): Promise<ConnectivityType[]> => {
      const { data, error } = await supabase
        .from('connectivity_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateConnectivityType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectivityType: { name: string; code?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('connectivity_types')
        .insert(connectivityType)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectivity-types'] });
      toast.success('Connectivity type added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add connectivity type: ${error.message}`);
    },
  });
}

export function useUpdateConnectivityType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; code?: string; description?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('connectivity_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectivity-types'] });
      toast.success('Connectivity type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update connectivity type: ${error.message}`);
    },
  });
}

export function useDeleteConnectivityType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('connectivity_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectivity-types'] });
      toast.success('Connectivity type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete connectivity type: ${error.message}`);
    },
  });
}
