import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RoleSettings {
  max_grace_days: number;
}

export interface CurrentUserRole {
  role: string;
  roleId: string | null;
  permissions: string[];
  settings: RoleSettings;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const DEFAULT_SETTINGS: RoleSettings = {
  max_grace_days: 5,
};

export function useCurrentUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-user-role', user?.id],
    queryFn: async (): Promise<CurrentUserRole> => {
      if (!user?.id) {
        return {
          role: 'viewer',
          roleId: null,
          permissions: [],
          settings: DEFAULT_SETTINGS,
          isAdmin: false,
          isSuperAdmin: false,
        };
      }

      // Get software user to find their role
      const { data: softwareUser, error: suError } = await supabase
        .from('software_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (suError) {
        console.error('Error fetching software user:', suError);
        throw suError;
      }

      const role = softwareUser?.role || 'viewer';
      const isSuperAdmin = role === 'super_admin';
      const isAdmin = role === 'super_admin' || role === 'admin';

      // Get role definition to fetch permissions and settings
      const { data: roleDef, error: rdError } = await supabase
        .from('role_definitions')
        .select('id, permissions')
        .eq('code', role)
        .eq('is_active', true)
        .maybeSingle();

      if (rdError) {
        console.error('Error fetching role definition:', rdError);
      }

      // Parse permissions - can be array of strings or object with settings
      let permissions: string[] = [];
      let settings: RoleSettings = { ...DEFAULT_SETTINGS };

      if (roleDef?.permissions) {
        const perms = roleDef.permissions as unknown;
        
        if (Array.isArray(perms)) {
          // Legacy format: array of permission strings
          permissions = perms as string[];
        } else if (typeof perms === 'object' && perms !== null) {
          // New format: object with permissions array and settings
          const permObj = perms as { permissions?: string[]; settings?: Partial<RoleSettings> };
          permissions = permObj.permissions || [];
          settings = { ...DEFAULT_SETTINGS, ...permObj.settings };
        }
      }

      return {
        role,
        roleId: roleDef?.id || null,
        permissions,
        settings,
        isAdmin,
        isSuperAdmin,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
