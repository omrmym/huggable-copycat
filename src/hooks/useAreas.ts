import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Area {
  id: string;
  name: string;
  code: string | null;
  police_station_id: string | null;
  district_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  police_station?: {
    id: string;
    name: string;
  } | null;
  district?: {
    id: string;
    name: string;
  } | null;
}

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select(`
          *,
          police_station:police_stations(id, name),
          district:districts(id, name)
        `)
        .order('name');

      if (error) throw error;
      return data as Area[];
    },
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (area: { name: string; code?: string | null; police_station_id?: string | null; district_id?: string | null; description?: string | null; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('areas')
        .insert(area)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast({ title: 'Success', description: 'Area created successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Area> & { id: string }) => {
      const { police_station, district, ...cleanUpdates } = updates;
      const { data, error } = await supabase
        .from('areas')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast({ title: 'Success', description: 'Area updated successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('areas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast({ title: 'Success', description: 'Area deleted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
