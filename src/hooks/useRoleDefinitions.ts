import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RoleDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleInput {
  code: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleInput {
  id: string;
  name?: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
}

export function useRoleDefinitions() {
  return useQuery({
    queryKey: ['role-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_definitions')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as RoleDefinition[];
    },
  });
}

export function useCreateRoleDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const { data, error } = await supabase
        .from('role_definitions')
        .insert({
          code: input.code.toLowerCase().replace(/\s+/g, '_'),
          name: input.name,
          description: input.description || null,
          permissions: input.permissions || [],
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as RoleDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-definitions'] });
      toast.success('Role created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });
}

export function useUpdateRoleDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRoleInput) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.permissions !== undefined) updateData.permissions = input.permissions;
      if (input.is_active !== undefined) updateData.is_active = input.is_active;

      const { data, error } = await supabase
        .from('role_definitions')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as RoleDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-definitions'] });
      toast.success('Role updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
}

export function useDeleteRoleDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('role_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-definitions'] });
      toast.success('Role deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });
}
