import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logSystemActivity } from '@/hooks/useSystemActivity';

export type { Tables };

export type UserStatus = 'active' | 'disabled' | 'expired' | 'suspended';
export type ServiceType = 'hotspot' | 'pppoe';

type RadiusUser = Omit<Tables<'radius_users'>, 'service_type' | 'status'> & {
  service_type: ServiceType;
  status: UserStatus;
  plan?: Tables<'billing_plans'> | null;
  creator_name?: string | null;
};

type RadiusUserInsert = TablesInsert<'radius_users'>;
type RadiusUserUpdate = TablesUpdate<'radius_users'>;

export function useRadiusUsers() {
  return useQuery({
    queryKey: ['radius-users'],
    queryFn: async (): Promise<RadiusUser[]> => {
      const { data, error } = await supabase
        .from('radius_users')
        .select(`
          *,
          plan:billing_plans(*)
        `)
        .is('reseller_id', null) // Only show users created by admin (not resellers)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch software users to map created_by UUIDs to names
      const creatorIds = [...new Set((data || []).map(u => u.created_by).filter(Boolean))];
      let creatorMap: Record<string, string> = {};
      
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from('software_users')
          .select('user_id, full_name')
          .in('user_id', creatorIds as string[]);
        
        if (creators) {
          creatorMap = creators.reduce((acc, c) => {
            acc[c.user_id] = c.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Add creator_name to each user
      return (data || []).map(user => ({
        ...user,
        service_type: user.service_type as ServiceType,
        status: user.status as UserStatus,
        creator_name: user.created_by ? creatorMap[user.created_by] || null : null,
      })) as RadiusUser[];
    },
  });
}

export function useCreateRadiusUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: RadiusUserInsert) => {
      // Get current auth user to set created_by
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const { data, error } = await supabase
        .from('radius_users')
        .insert({
          ...user,
          created_by: userId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Sync to MikroTik
      try {
        await supabase.functions.invoke('mikrotik-sync', {
          body: {
            action: 'sync-user',
            username: user.username,
            password: user.password_hash,
            service_type: user.service_type,
            disabled: (user.status || 'active') !== 'active',
          },
        });
      } catch (syncError) {
        console.warn('MikroTik sync failed:', syncError);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      logSystemActivity({
        action: 'create',
        entityType: 'radius_user',
        entityId: data.id,
        entityName: variables.full_name || variables.username,
        details: { username: variables.username, service_type: variables.service_type },
      });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });
}

export function useUpdateRadiusUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: RadiusUserUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('radius_users')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          plan:billing_plans(name)
        `)
        .single();

      if (error) throw error;

      // Sync to MikroTik if relevant fields changed
      if (updates.password_hash || updates.status !== undefined) {
        try {
          // If status changed to 'expired', use the expire-user action to apply configured behavior
          if (updates.status === 'expired') {
            // Fetch the expiration behavior settings
            const { data: settingsData } = await supabase
              .from('app_settings')
              .select('value')
              .eq('key', 'mikrotik_expiration_behavior')
              .maybeSingle();

            const expSettings = settingsData?.value as { 
              behavior?: 'change_profile' | 'disable_user'; 
              expired_profile_name?: string 
            } | null;

            const behavior = expSettings?.behavior || 'disable_user';
            const expiredProfileName = expSettings?.expired_profile_name || 'expired';

            await supabase.functions.invoke('mikrotik-sync', {
              body: {
                action: 'expire-user',
                username: data.username,
                service_type: data.service_type,
                behavior,
                expired_profile_name: expiredProfileName,
              },
            });
          } else {
            // For other status changes, use the regular sync-user action
            const planData = data.plan as { name: string } | null;
            const profileName = planData?.name || undefined;

            await supabase.functions.invoke('mikrotik-sync', {
              body: {
                action: 'sync-user',
                username: data.username,
                password: data.password_hash,
                service_type: data.service_type,
                disabled: data.status !== 'active',
                profile: profileName,
              },
            });
          }

          // Immediately disconnect active session when user is disabled/expired/suspended
          if (updates.status && updates.status !== 'active') {
            await supabase.functions.invoke('mikrotik-sync', {
              body: {
                action: 'disconnect-user',
                username: data.username,
                service_type: data.service_type,
              },
            });
          }
        } catch (syncError) {
          console.warn('MikroTik sync failed:', syncError);
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      logSystemActivity({
        action: 'update',
        entityType: 'radius_user',
        entityId: data.id,
        entityName: data.full_name || data.username,
      });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });
}

export function useDeleteRadiusUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, username, service_type }: { id: string; username: string; service_type: 'hotspot' | 'pppoe' }) => {
      // Delete from MikroTik first
      try {
        await supabase.functions.invoke('mikrotik-sync', {
          body: {
            action: 'delete-user',
            username,
            service_type,
          },
        });
      } catch (syncError) {
        console.warn('MikroTik delete failed:', syncError);
      }

      const { error } = await supabase
        .from('radius_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      logSystemActivity({
        action: 'delete',
        entityType: 'radius_user',
        entityId: variables.id,
        entityName: variables.username,
      });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });
}

export function useBulkDeleteRadiusUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (users: { id: string; username: string; service_type: 'hotspot' | 'pppoe' }[]) => {
      // Delete from MikroTik first for each user
      for (const user of users) {
        try {
          await supabase.functions.invoke('mikrotik-sync', {
            body: {
              action: 'delete-user',
              username: user.username,
              service_type: user.service_type,
            },
          });
        } catch (syncError) {
          console.warn(`MikroTik delete failed for ${user.username}:`, syncError);
        }
      }

      // Delete all users from database
      const ids = users.map(u => u.id);
      const { error } = await supabase
        .from('radius_users')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return users.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      toast.success(`${count} user(s) deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete users: ${error.message}`);
    },
  });
}

export function useBulkTransferRouter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      users,
      targetRouterId,
    }: {
      users: { id: string; username: string; service_type: 'hotspot' | 'pppoe'; mikrotik_router_id: string | null }[];
      targetRouterId: string;
    }) => {
      // For each user, delete from old router and add to new router
      for (const user of users) {
        // Delete from old router if they had one
        if (user.mikrotik_router_id) {
          try {
            await supabase.functions.invoke('mikrotik-sync', {
              body: {
                action: 'delete-user',
                username: user.username,
                service_type: user.service_type,
                router_id: user.mikrotik_router_id,
              },
            });
          } catch (syncError) {
            console.warn(`MikroTik delete failed for ${user.username}:`, syncError);
          }
        }
      }

      // Update all users' router_id in database and mark for sync
      const ids = users.map((u) => u.id);
      const { error: updateError } = await supabase
        .from('radius_users')
        .update({
          mikrotik_router_id: targetRouterId,
          mikrotik_synced: false,
        })
        .in('id', ids);

      if (updateError) throw updateError;

      // Sync users to new router
      for (const user of users) {
        try {
          // Get full user data for sync
          const { data: userData } = await supabase
            .from('radius_users')
            .select('username, password_hash, service_type, status')
            .eq('id', user.id)
            .single();

          if (userData) {
            await supabase.functions.invoke('mikrotik-sync', {
              body: {
                action: 'sync-user',
                username: userData.username,
                password: userData.password_hash,
                service_type: userData.service_type,
                disabled: userData.status !== 'active',
                router_id: targetRouterId,
              },
            });
          }
        } catch (syncError) {
          console.warn(`MikroTik sync to new router failed for ${user.username}:`, syncError);
        }
      }

      return users.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      toast.success(`${count} user(s) transferred successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to transfer users: ${error.message}`);
    },
  });
}

export function useDisconnectUser() {
  return useMutation({
    mutationFn: async ({ username, service_type }: { username: string; service_type: 'hotspot' | 'pppoe' }) => {
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: {
          action: 'disconnect-user',
          username,
          service_type,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('User disconnected successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect user: ${error.message}`);
    },
  });
}

export function useRechargeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      amount, 
      description,
      paymentMethod,
      collectedBy,
      planId,
    }: { 
      userId: string; 
      amount: number; 
      description?: string;
      paymentMethod?: string;
      collectedBy?: string;
      planId?: string;
    }) => {
      // Get current user data including status, expires_at, billing_cycle, grace_days_used, and plan
      const { data: user, error: fetchError } = await supabase
        .from('radius_users')
        .select('username, status, expires_at, billing_cycle, plan_id, grace_days_used, service_type, password_hash, billing_plans:plan_id(name, data_limit_mb, duration_days)')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const billingCycle = user.billing_cycle || 'monthly';
      const graceDaysUsed = user.grace_days_used || 0;
      const planData = (user as any).billing_plans;
      const planDurationDays = planData?.duration_days || null;
      
      // Calculate new expiration date based on plan duration_days or billing cycle
      let newExpiresAt: Date;
      const now = new Date();
      
      if (user.status === 'expired' || user.status === 'disabled' || !user.expires_at) {
        // If expired/disabled or no expiration, calculate from current date
        newExpiresAt = new Date(now);
      } else {
        // If active, calculate from current expiration date
        newExpiresAt = new Date(user.expires_at);
      }
      
      // Use plan's duration_days if available, otherwise fall back to billing cycle
      if (planDurationDays && planDurationDays > 0) {
        newExpiresAt.setDate(newExpiresAt.getDate() + planDurationDays);
      } else if (billingCycle === '30 Days' || billingCycle === '30days') {
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);
      } else {
        // Monthly - add 1 month
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
      }
      
      // Deduct grace days used from the new expiration date
      if (graceDaysUsed > 0) {
        newExpiresAt.setDate(newExpiresAt.getDate() - graceDaysUsed);
      }
      
      // Set expiration time to 09:00 AM
      newExpiresAt.setHours(9, 0, 0, 0);

      // Build update object - only include plan_id if explicitly provided
      const updateData: Record<string, unknown> = {
        status: 'active',
        expires_at: newExpiresAt.toISOString(),
        mikrotik_synced: false,
        grace_days_used: 0, // Reset grace days after recharge
      };
      
      // Only update plan_id if a new one is explicitly provided
      if (planId) {
        updateData.plan_id = planId;
      }

      // Update status and expiry
      const { error: updateError } = await supabase
        .from('radius_users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;

      // Record transaction with payment_method and collected_by
      // Include note about grace days deduction if applicable
      let txDescription = description || `Recharge for ${user.username}`;
      if (graceDaysUsed > 0) {
        txDescription += ` (${graceDaysUsed} grace day(s) deducted)`;
      }

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          radius_user_id: userId,
          amount,
          type: 'payment',
          description: txDescription,
          status: 'completed',
          payment_method: paymentMethod,
          collected_by: collectedBy,
        });

      if (txError) throw txError;

      // Enable user in MikroTik with correct profile (sync-user re-creates/updates as enabled)
      try {
        const profileName = planData?.name || undefined;

        await supabase.functions.invoke('mikrotik-sync', {
          body: {
            action: 'sync-user',
            username: user.username,
            password: (user as any).password_hash,
            profile: profileName,
            service_type: (user as any).service_type,
            disabled: false,
          },
        });
      } catch (syncError) {
        console.warn('MikroTik enable after recharge failed:', syncError);
      }

      return { newExpiresAt, graceDaysDeducted: graceDaysUsed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      let message = `Recharge successful! Expires: ${new Date(data.newExpiresAt).toLocaleDateString()}`;
      if (data.graceDaysDeducted > 0) {
        message += ` (${data.graceDaysDeducted} grace day(s) deducted)`;
      }
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Failed to recharge: ${error.message}`);
    },
  });
}