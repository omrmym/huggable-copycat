import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { logSystemActivity } from '@/hooks/useSystemActivity';

type Transaction = Tables<'transactions'> & {
  radius_user?: {
    id: string;
    username: string;
    full_name: string | null;
    phone: string | null;
    balance: number;
    expires_at: string | null;
    billing_cycle: string | null;
    plan_id: string | null;
    plan?: {
      id: string;
      name: string;
      price: number;
    } | null;
  } | null;
  collected_by?: string | null;
  payment_method?: string | null;
};

export function useTransactions(status?: string) {
  return useQuery({
    queryKey: ['transactions', status],
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          radius_user:radius_users(id, username, full_name, phone, balance, expires_at, billing_cycle, plan_id, plan:billing_plans(id, name, price))
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
}

export function useUserTransactions(userId: string | undefined) {
  return useQuery({
    queryKey: ['transactions', 'user', userId],
    queryFn: async (): Promise<Transaction[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('radius_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useCompletedTransactions() {
  return useTransactions('completed');
}

export function usePendingTransactions() {
  return useTransactions('pending');
}

export function useApproveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, userId, amount }: { transactionId: string; userId: string; amount: number }) => {
      // Get current user balance
      const { data: user, error: fetchError } = await supabase
        .from('radius_users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = (user.balance || 0) + amount;

      // Update transaction status
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId);

      if (txError) throw txError;

      // Update user balance
      const { error: balanceError } = await supabase
        .from('radius_users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      return { newBalance };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      toast.success('Transaction approved and balance updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve transaction: ${error.message}`);
    },
  });
}

export function useRejectTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: string; reason?: string }) => {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'failed',
          description: reason ? `Rejected: ${reason}` : 'Transaction rejected'
        })
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject transaction: ${error.message}`);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      transactionId, 
      userId, 
      amount, 
      billingCycle 
    }: { 
      transactionId: string; 
      userId: string | null; 
      amount: number;
      billingCycle: string;
    }) => {
      // Delete the transaction first
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (deleteError) throw deleteError;

      // Only update user if userId exists
      if (userId) {
        // Get current user data including plan info
        const { data: user, error: fetchError } = await supabase
          .from('radius_users')
          .select('balance, expires_at, billing_cycle, plan_id, status, billing_plans:plan_id(duration_days)')
          .eq('id', userId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (user) {
          // Calculate new balance (subtract the transaction amount)
          const newBalance = Math.max((user.balance || 0) - amount, 0);

          // Calculate previous expiration date using plan duration or billing cycle
          let newExpiresAt = user.expires_at;
          if (user.expires_at) {
            const currentExpiry = new Date(user.expires_at);
            const planData = (user as any).billing_plans;
            const planDurationDays = planData?.duration_days || null;
            const cycle = user.billing_cycle || billingCycle || 'monthly';
            
            if (planDurationDays && planDurationDays > 0) {
              // Use plan's duration_days to go back
              currentExpiry.setDate(currentExpiry.getDate() - planDurationDays);
            } else if (cycle === '30 Days' || cycle === '30days') {
              currentExpiry.setDate(currentExpiry.getDate() - 30);
            } else {
              // Monthly - subtract 1 month
              currentExpiry.setMonth(currentExpiry.getMonth() - 1);
            }
            
            newExpiresAt = currentExpiry.toISOString();
          }

          // Determine new status based on the reverted expiration date
          let newStatus = 'active';
          if (newExpiresAt) {
            const expiryDate = new Date(newExpiresAt);
            const now = new Date();
            if (expiryDate <= now) {
              newStatus = 'expired';
            }
          }

          // Update user balance, expiration date, and status
          const updateData: Record<string, unknown> = { 
            balance: newBalance,
            expires_at: newExpiresAt,
            status: newStatus,
          };

          const { error: updateError } = await supabase
            .from('radius_users')
            .update(updateData)
            .eq('id', userId);

          if (updateError) throw updateError;

          // Sync MikroTik status (enable/disable based on new status)
          try {
            const { data: userData } = await supabase
              .from('radius_users')
              .select('username, password_hash, service_type, status')
              .eq('id', userId)
              .single();

            if (userData) {
              await supabase.functions.invoke('mikrotik-sync', {
                body: {
                  action: 'sync-user',
                  username: userData.username,
                  password: userData.password_hash,
                  service_type: userData.service_type,
                  disabled: userData.status !== 'active',
                },
              });
            }
          } catch (syncError) {
            console.warn('MikroTik sync after bill delete failed:', syncError);
          }

          return { newBalance, newExpiresAt };
        }
      }

      return { newBalance: null, newExpiresAt: null };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['radius-users'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-with-plans'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      logSystemActivity({
        action: 'delete',
        entityType: 'transaction',
        entityId: variables.transactionId,
        details: { amount: variables.amount },
      });
      if (data.newBalance !== null) {
        toast.success('Invoice deleted and user expiry date updated');
      } else {
        toast.success('Invoice deleted');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      radiusUserId,
      amount,
      type,
      description,
      status = 'completed',
      paymentMethod,
      collectedBy,
    }: {
      radiusUserId: string;
      amount: number;
      type: string;
      description?: string;
      status?: string;
      paymentMethod?: string;
      collectedBy?: string;
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          radius_user_id: radiusUserId,
          amount,
          type,
          description,
          status,
          payment_method: paymentMethod,
          collected_by: collectedBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      logSystemActivity({
        action: 'recharge',
        entityType: 'transaction',
        entityId: data.id,
        details: { amount: variables.amount, type: variables.type },
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create transaction: ${error.message}`);
    },
  });
}
