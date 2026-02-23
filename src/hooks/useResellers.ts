import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logSystemActivity } from '@/hooks/useSystemActivity';

export interface Reseller {
  id: string;
  name: string;
  code: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  commission_rate: number | null;
  balance: number;
  login_user_id: string | null;
  login_password: string | null;
  is_active: boolean;
  role_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useResellers() {
  return useQuery({
    queryKey: ['resellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Reseller[];
    },
  });
}

export function useCreateReseller() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reseller: Omit<Reseller, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('resellers')
        .insert(reseller)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resellers'] });
      logSystemActivity({
        action: 'create',
        entityType: 'reseller',
        entityId: data.id,
        entityName: variables.name,
      });
      toast({ title: 'Success', description: 'Reseller created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateReseller() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Reseller> & { id: string }) => {
      const { data, error } = await supabase
        .from('resellers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resellers'] });
      logSystemActivity({
        action: 'update',
        entityType: 'reseller',
        entityId: data.id,
        entityName: data.name,
      });
      toast({ title: 'Success', description: 'Reseller updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteReseller() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('resellers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['resellers'] });
      logSystemActivity({
        action: 'delete',
        entityType: 'reseller',
        entityId: deletedId,
      });
      toast({ title: 'Success', description: 'Reseller deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
