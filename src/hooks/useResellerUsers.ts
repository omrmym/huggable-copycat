import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ResellerUser {
  id: string;
  reseller_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  login_user_id: string | null;
  login_password: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  resellers?: { name: string } | null;
}

export function useResellerUsers(resellerId?: string) {
  return useQuery({
    queryKey: ['reseller-users', resellerId],
    queryFn: async () => {
      let query = supabase
        .from('reseller_users')
        .select('*, resellers(name)')
        .order('full_name');
      
      if (resellerId) {
        query = query.eq('reseller_id', resellerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ResellerUser[];
    },
  });
}

export function useCreateResellerUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (user: Omit<ResellerUser, 'id' | 'created_at' | 'updated_at' | 'resellers'>) => {
      const { data, error } = await supabase
        .from('reseller_users')
        .insert(user)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-users'] });
      toast({ title: 'Success', description: 'Reseller user created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateResellerUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ResellerUser> & { id: string }) => {
      const { data, error } = await supabase
        .from('reseller_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-users'] });
      toast({ title: 'Success', description: 'Reseller user updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteResellerUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reseller_users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-users'] });
      toast({ title: 'Success', description: 'Reseller user deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
