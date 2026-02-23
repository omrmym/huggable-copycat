import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserSpeedData {
  downloadSpeedKbps: number;
  uploadSpeedKbps: number;
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  planName: string | null;
}

export function useUserSpeedChart(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-speed-chart', userId],
    queryFn: async (): Promise<UserSpeedData> => {
      if (!userId) {
        return {
          downloadSpeedKbps: 0,
          uploadSpeedKbps: 0,
          downloadSpeedMbps: 0,
          uploadSpeedMbps: 0,
          planName: null,
        };
      }

      const { data: user, error } = await supabase
        .from('radius_users')
        .select(`
          plan_id,
          billing_plans (
            name,
            download_speed_kbps,
            upload_speed_kbps
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error || !user) {
        return {
          downloadSpeedKbps: 0,
          uploadSpeedKbps: 0,
          downloadSpeedMbps: 0,
          uploadSpeedMbps: 0,
          planName: null,
        };
      }

      const plan = user.billing_plans as { 
        name: string; 
        download_speed_kbps: number; 
        upload_speed_kbps: number;
      } | null;

      const downloadSpeedKbps = plan?.download_speed_kbps || 0;
      const uploadSpeedKbps = plan?.upload_speed_kbps || 0;

      return {
        downloadSpeedKbps,
        uploadSpeedKbps,
        downloadSpeedMbps: downloadSpeedKbps / 1024,
        uploadSpeedMbps: uploadSpeedKbps / 1024,
        planName: plan?.name || null,
      };
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
}
