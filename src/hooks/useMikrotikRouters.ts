import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MikrotikRouter {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  description: string | null;
  is_active: boolean;
  connection_mode: 'api' | 'rest';
  use_ssl: boolean;
  created_at: string;
  updated_at: string;
}

export function useMikrotikRouters() {
  return useQuery({
    queryKey: ['mikrotik-routers'],
    queryFn: async (): Promise<MikrotikRouter[]> => {
      const { data, error } = await supabase
        .from('mikrotik_routers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      // Cast connection_mode since DB returns string
      return (data || []).map(router => ({
        ...router,
        connection_mode: (router.connection_mode as 'api' | 'rest') || 'api',
        use_ssl: router.use_ssl ?? false,
      }));
    },
  });
}

export function useCreateMikrotikRouter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (router: Omit<MikrotikRouter, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mikrotik_routers')
        .insert(router)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mikrotik-routers'] });
      toast.success('MikroTik router added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add router: ${error.message}`);
    },
  });
}

export function useDeactivateMikrotikRouter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routerId: string) => {
      const { error } = await supabase
        .from('mikrotik_routers')
        .update({ is_active: false })
        .eq('id', routerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mikrotik-routers'] });
      queryClient.invalidateQueries({ queryKey: ['default-router'] });
      toast.success('Router disconnected successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect router: ${error.message}`);
    },
  });
}

export function useActivateMikrotikRouter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routerId: string) => {
      const { error } = await supabase
        .from('mikrotik_routers')
        .update({ is_active: true })
        .eq('id', routerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mikrotik-routers'] });
      queryClient.invalidateQueries({ queryKey: ['default-router'] });
      toast.success('Router reconnected successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reconnect router: ${error.message}`);
    },
  });
}
