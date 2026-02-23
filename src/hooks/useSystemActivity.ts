import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemActivity {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export type EntityType = 
  | 'software_user'
  | 'radius_user'
  | 'billing_plan'
  | 'reseller'
  | 'branch'
  | 'transaction'
  | 'expense'
  | 'income'
  | 'employee'
  | 'mikrotik_router'
  | 'settings'
  | 'role'
  | 'voucher';

export type ActionType = 'create' | 'update' | 'delete' | 'recharge' | 'status_change' | 'login' | 'logout';

export function useSystemActivity(limit = 100) {
  return useQuery({
    queryKey: ['system-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SystemActivity[];
    },
  });
}

export function useClearSystemActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('system_activity')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-activity'] });
    },
  });
}

export async function logSystemActivity(params: {
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, string | number | boolean | null>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot log activity: No authenticated user');
      return;
    }

    const { error } = await supabase.from('system_activity').insert([{
      user_id: user.id,
      user_email: user.email || 'unknown',
      user_name: user.user_metadata?.full_name || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      entity_name: params.entityName || null,
      details: params.details ? JSON.parse(JSON.stringify(params.details)) : null,
    }]);

    if (error) {
      console.error('Failed to log system activity:', error);
    }
  } catch (err) {
    console.error('Error logging system activity:', err);
  }
}

// Helper function to get user-friendly action labels
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    recharge: 'Recharged',
    status_change: 'Status Changed',
    login: 'Signed In',
    logout: 'Signed Out',
  };
  return labels[action] || action;
}

// Helper function to get user-friendly entity labels
export function getEntityLabel(entityType: string): string {
  const labels: Record<string, string> = {
    software_user: 'Software User',
    radius_user: 'User',
    billing_plan: 'Plan',
    reseller: 'Reseller',
    branch: 'Branch',
    transaction: 'Transaction',
    expense: 'Expense',
    income: 'Income',
    employee: 'Employee',
    mikrotik_router: 'Router',
    settings: 'Settings',
    role: 'Role',
    voucher: 'Voucher',
  };
  return labels[entityType] || entityType;
}
