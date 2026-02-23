import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PoliceStation {
  id: string;
  name: string;
  code: string | null;
  district_id: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  district?: {
    id: string;
    name: string;
  } | null;
}

export function usePoliceStations() {
  return useQuery({
    queryKey: ['police_stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('police_stations')
        .select(`
          *,
          district:districts(id, name)
        `)
        .order('name');

      if (error) throw error;
      return data as PoliceStation[];
    },
  });
}

export function useCreatePoliceStation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (station: { name: string; code?: string | null; district_id?: string | null; address?: string | null; phone?: string | null; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('police_stations')
        .insert(station)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['police_stations'] });
      toast({ title: 'Success', description: 'Police station created successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdatePoliceStation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PoliceStation> & { id: string }) => {
      const { district, ...cleanUpdates } = updates;
      const { data, error } = await supabase
        .from('police_stations')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['police_stations'] });
      toast({ title: 'Success', description: 'Police station updated successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeletePoliceStation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('police_stations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['police_stations'] });
      toast({ title: 'Success', description: 'Police station deleted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
