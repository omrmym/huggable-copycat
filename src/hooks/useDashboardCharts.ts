import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths, startOfDay, subDays } from 'date-fns';

// Helper to get admin-only user IDs (reseller_id is null)
async function getAdminUserIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('radius_users')
    .select('id')
    .is('reseller_id', null);
  return new Set(data?.map(u => u.id) || []);
}

export function useMonthlyBillCollection() {
  return useQuery({
    queryKey: ['monthly-bill-collection'],
    queryFn: async () => {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      const now = endOfMonth(new Date());

      const [adminUserIds, { data: transactions }] = await Promise.all([
        getAdminUserIds(),
        supabase
          .from('transactions')
          .select('amount, radius_user_id, created_at')
          .eq('type', 'payment')
          .gte('created_at', sixMonthsAgo.toISOString())
          .lte('created_at', now.toISOString()),
      ]);

      // Build ordered month keys
      const monthKeys: string[] = [];
      for (let i = 5; i >= 0; i--) {
        monthKeys.push(format(subMonths(new Date(), i), 'MMM'));
      }
      const monthMap: Record<string, number> = {};
      monthKeys.forEach(k => (monthMap[k] = 0));

      (transactions || []).forEach(t => {
        if (t.radius_user_id && adminUserIds.has(t.radius_user_id)) {
          const key = format(new Date(t.created_at), 'MMM');
          if (key in monthMap) {
            monthMap[key] += Number(t.amount);
          }
        }
      });

      return monthKeys.map(month => ({ month, amount: monthMap[month] }));
    },
  });
}

export function useDailyBillCollection() {
  return useQuery({
    queryKey: ['daily-bill-collection'],
    queryFn: async () => {
      const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
      const endOfToday = new Date(startOfDay(new Date()));
      endOfToday.setHours(23, 59, 59, 999);

      const [adminUserIds, { data: transactions }] = await Promise.all([
        getAdminUserIds(),
        supabase
          .from('transactions')
          .select('amount, radius_user_id, created_at')
          .eq('type', 'payment')
          .gte('created_at', sevenDaysAgo.toISOString())
          .lte('created_at', endOfToday.toISOString()),
      ]);

      const dayKeys: { key: string; label: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        dayKeys.push({ key: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE') });
      }
      const dayMap: Record<string, number> = {};
      dayKeys.forEach(d => (dayMap[d.key] = 0));

      (transactions || []).forEach(t => {
        if (t.radius_user_id && adminUserIds.has(t.radius_user_id)) {
          const key = format(new Date(t.created_at), 'yyyy-MM-dd');
          if (key in dayMap) {
            dayMap[key] += Number(t.amount);
          }
        }
      });

      return dayKeys.map(d => ({ day: d.label, amount: dayMap[d.key] }));
    },
  });
}

export function useMonthlyPaidUsers() {
  return useQuery({
    queryKey: ['monthly-paid-users'],
    queryFn: async () => {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      const now = endOfMonth(new Date());

      const [adminUserIds, { data: transactions }] = await Promise.all([
        getAdminUserIds(),
        supabase
          .from('transactions')
          .select('radius_user_id, created_at')
          .eq('type', 'payment')
          .gte('created_at', sixMonthsAgo.toISOString())
          .lte('created_at', now.toISOString()),
      ]);

      const monthKeys: string[] = [];
      for (let i = 5; i >= 0; i--) {
        monthKeys.push(format(subMonths(new Date(), i), 'MMM'));
      }
      const monthMap: Record<string, Set<string>> = {};
      monthKeys.forEach(k => (monthMap[k] = new Set()));

      (transactions || []).forEach(t => {
        if (t.radius_user_id && adminUserIds.has(t.radius_user_id)) {
          const key = format(new Date(t.created_at), 'MMM');
          if (key in monthMap) {
            monthMap[key].add(t.radius_user_id);
          }
        }
      });

      return monthKeys.map(month => ({ month, users: monthMap[month].size }));
    },
  });
}

export function useDailyNewUsers() {
  return useQuery({
    queryKey: ['daily-new-users'],
    queryFn: async () => {
      const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
      const endOfToday = new Date(startOfDay(new Date()));
      endOfToday.setHours(23, 59, 59, 999);

      const { data: users } = await supabase
        .from('radius_users')
        .select('created_at')
        .is('reseller_id', null)
        .gte('created_at', sevenDaysAgo.toISOString())
        .lte('created_at', endOfToday.toISOString());

      const dayKeys: { key: string; label: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        dayKeys.push({ key: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE') });
      }
      const dayMap: Record<string, number> = {};
      dayKeys.forEach(d => (dayMap[d.key] = 0));

      (users || []).forEach(u => {
        const key = format(new Date(u.created_at), 'yyyy-MM-dd');
        if (key in dayMap) {
          dayMap[key]++;
        }
      });

      return dayKeys.map(d => ({ day: d.label, users: dayMap[d.key] }));
    },
  });
}
