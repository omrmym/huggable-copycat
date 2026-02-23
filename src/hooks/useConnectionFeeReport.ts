import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConnectionFeeRecord {
  id: string;
  username: string;
  full_name: string | null;
  connection_date: string | null;
  connection_fee: number | null;
  created_by: string | null;
  creator_name: string | null;
}

export function useConnectionFeeReport() {
  return useQuery({
    queryKey: ['connection-fee-report'],
    queryFn: async (): Promise<ConnectionFeeRecord[]> => {
      // Fetch radius users with connection fees
      const { data: users, error: usersError } = await supabase
        .from('radius_users')
        .select('id, username, full_name, connection_date, connection_fee, created_by')
        .gt('connection_fee', 0)
        .order('connection_date', { ascending: false });

      if (usersError) throw usersError;

      // Get unique creator IDs
      const creatorIds = [...new Set(users?.map(u => u.created_by).filter(Boolean))] as string[];

      // Fetch software users for creator login IDs
      let creatorMap: Record<string, string> = {};
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from('software_users')
          .select('user_id, login_user_id')
          .in('user_id', creatorIds);

        if (creators) {
          creatorMap = creators.reduce((acc, c) => {
            acc[c.user_id] = c.login_user_id || '';
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Map users with creator login IDs
      return (users || []).map(user => ({
        ...user,
        creator_name: user.created_by ? creatorMap[user.created_by] || null : null,
      }));
    },
  });
}
