import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths, startOfDay, subDays } from 'date-fns';

// Helper to get admin-only user IDs (reseller_id is null)
async function getAdminUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from('radius_users')
    .select('id')
    .is('reseller_id', null);
  return data?.map(u => u.id) || [];
}

export function useMonthlyBillCollection() {
  return useQuery({
    queryKey: ['monthly-bill-collection'],
    queryFn: async () => {
      const adminUserIds = await getAdminUserIds();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const { data } = await supabase
          .from('transactions')
          .select('amount, radius_user_id')
          .eq('status', 'completed')
          .eq('type', 'payment')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        
        // Filter to only include transactions for admin-created users
        const adminTransactions = data?.filter(t => t.radius_user_id && adminUserIds.includes(t.radius_user_id)) || [];
        const total = adminTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        months.push({
          month: format(date, 'MMM'),
          amount: total,
        });
      }
      return months;
    },
  });
}

export function useDailyBillCollection() {
  return useQuery({
    queryKey: ['daily-bill-collection'],
    queryFn: async () => {
      const adminUserIds = await getAdminUserIds();
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const start = startOfDay(date);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        
        const { data } = await supabase
          .from('transactions')
          .select('amount, radius_user_id')
          .eq('status', 'completed')
          .eq('type', 'payment')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        
        // Filter to only include transactions for admin-created users
        const adminTransactions = data?.filter(t => t.radius_user_id && adminUserIds.includes(t.radius_user_id)) || [];
        const total = adminTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        days.push({
          day: format(date, 'EEE'),
          amount: total,
        });
      }
      return days;
    },
  });
}

export function useMonthlyPaidUsers() {
  return useQuery({
    queryKey: ['monthly-paid-users'],
    queryFn: async () => {
      const adminUserIds = await getAdminUserIds();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const { data } = await supabase
          .from('transactions')
          .select('radius_user_id')
          .eq('status', 'completed')
          .eq('type', 'payment')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        
        // Count unique admin-created users who paid
        const adminTransactions = data?.filter(t => t.radius_user_id && adminUserIds.includes(t.radius_user_id)) || [];
        const uniqueUsers = new Set(adminTransactions.map(t => t.radius_user_id));
        months.push({
          month: format(date, 'MMM'),
          users: uniqueUsers.size,
        });
      }
      return months;
    },
  });
}

export function useDailyNewUsers() {
  return useQuery({
    queryKey: ['daily-new-users'],
    queryFn: async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const start = startOfDay(date);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        
        // Only count admin-created users (reseller_id is null)
        const { count } = await supabase
          .from('radius_users')
          .select('*', { count: 'exact', head: true })
          .is('reseller_id', null)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        
        days.push({
          day: format(date, 'EEE'),
          users: count || 0,
        });
      }
      return days;
    },
  });
}
