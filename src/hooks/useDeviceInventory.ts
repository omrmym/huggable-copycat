import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeviceListItem {
  id: string;
  username: string;
  full_name: string | null;
  area_id: string | null;
  address_details: string | null;
  mac_serial: string | null;
  connectivity_type: string | null;
  status: string;
  updated_at: string;
  areas?: { name: string } | null;
}

export interface DeviceChangeRequest {
  id: string;
  radius_user_id: string;
  requested_by: string | null;
  old_device: string | null;
  new_device: string | null;
  old_mac_serial: string | null;
  new_mac_serial: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  radius_users?: {
    username: string;
    full_name: string | null;
    area_id: string | null;
    areas?: { name: string } | null;
  } | null;
}

export function useDeviceList(resellerId?: string) {
  return useQuery({
    queryKey: ['device-list', resellerId],
    queryFn: async (): Promise<DeviceListItem[]> => {
      let query = supabase
        .from('radius_users')
        .select('id, username, full_name, area_id, address_details, mac_serial, connectivity_type, status, updated_at, areas(name)')
        .order('updated_at', { ascending: false });

      if (resellerId) {
        query = query.eq('reseller_id', resellerId);
      } else {
        query = query.is('reseller_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DeviceListItem[];
    },
  });
}

export function useDeviceChangeRequests(status?: string) {
  return useQuery({
    queryKey: ['device-change-requests', status],
    queryFn: async (): Promise<DeviceChangeRequest[]> => {
      let query = supabase
        .from('device_change_requests')
        .select('*, radius_users(username, full_name, area_id, areas(name))')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DeviceChangeRequest[];
    },
  });
}

export function useApproveDeviceChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, approve, rejectionReason }: { id: string; approve: boolean; rejectionReason?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        status: approve ? 'approved' : 'rejected',
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
      };

      if (!approve && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { data: request, error: fetchError } = await supabase
        .from('device_change_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('device_change_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // If approved, update the radius_users table
      if (approve && request) {
        const radiusUpdate: any = {};
        if (request.new_device) radiusUpdate.connectivity_type = request.new_device;
        if (request.new_mac_serial !== undefined) radiusUpdate.mac_serial = request.new_mac_serial;

        if (Object.keys(radiusUpdate).length > 0) {
          const { error: userError } = await supabase
            .from('radius_users')
            .update(radiusUpdate)
            .eq('id', request.radius_user_id);

          if (userError) throw userError;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['device-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['device-list'] });
      toast.success(variables.approve ? 'Device change approved' : 'Device change rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
}
