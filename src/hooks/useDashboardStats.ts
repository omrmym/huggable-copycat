import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  suspendedUsers: number;
  disabledUsers: number;
  freeUsers: number;
  alreadyPaidUsers: number;
  totalVouchers: number;
  unusedVouchers: number;
  activeVouchers: number;
  totalRevenue: number;
  totalDataUsedMB: number;
  totalBill: number;
  activeUsersBill: number;
  expiredUsersBill: number;
  alreadyPaidBill: number;
  totalConnectionFee: number;
  totalExtraIncome: number;
  autoRenewUsers: number;
  autoRenewBill: number;
  pendingRequests: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      // Get user stats (only admin-created users)
      const { data: users, error: usersError } = await supabase
        .from('radius_users')
        .select('id, status, data_used_mb, monthly_bill, connection_fee, auto_renew, connection_date, created_at')
        .is('reseller_id', null);

      if (usersError) throw usersError;

      // Get voucher stats
      const { data: vouchers, error: vouchersError } = await supabase
        .from('vouchers')
        .select('status');

      if (vouchersError) throw vouchersError;

      // Get transaction stats for running month only
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, type, status, is_auto_generated, created_at, radius_user_id')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      if (transactionsError) throw transactionsError;

      // Get manual income and pending requests for running month
      const [incomeResult, pendingRequestsResult] = await Promise.all([
        supabase.from('income').select('amount').gte('date', monthStart.slice(0, 10)).lte('date', monthEnd.slice(0, 10)),
        supabase.from('user_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      if (incomeResult.error) throw incomeResult.error;
      const incomeData = incomeResult.data;
      const pendingRequests = pendingRequestsResult.count || 0;

      // User counts (current state, not filtered by month)
      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.status === 'active').length || 0;
      const expiredUsers = users?.filter(u => u.status === 'expired').length || 0;
      const suspendedUsers = users?.filter(u => u.status === 'suspended').length || 0;
      const disabledUsers = users?.filter(u => u.status === 'disabled').length || 0;
      const freeUsers = users?.filter(u => (u.monthly_bill || 0) === 0).length || 0;
      // Already paid: users who have a completed payment transaction this month
      const paidTransactions = transactions?.filter(t => t.status === 'completed' && t.type === 'payment') || [];
      const paidUserIds = new Set(paidTransactions.map(t => t.radius_user_id).filter(Boolean));
      const paidUsersInScope = users?.filter(u => paidUserIds.has(u.id)) || [];
      const alreadyPaidUsers = paidUsersInScope.length;
      const autoRenewUsers = users?.filter(u => u.auto_renew === true).length || 0;
      const totalDataUsedMB = users?.reduce((sum, u) => sum + (u.data_used_mb || 0), 0) || 0;

      // Bill calculations (current state)
      const totalBill = users?.reduce((sum, u) => sum + (u.monthly_bill || 0), 0) || 0;
      const activeUsersBill = users?.filter(u => u.status === 'active').reduce((sum, u) => sum + (u.monthly_bill || 0), 0) || 0;
      const expiredUsersBill = users?.filter(u => u.status === 'expired').reduce((sum, u) => sum + (u.monthly_bill || 0), 0) || 0;
      const alreadyPaidBill = paidUsersInScope.reduce((sum, u) => sum + (u.monthly_bill || 0), 0);

      const totalVouchers = vouchers?.length || 0;
      const unusedVouchers = vouchers?.filter(v => v.status === 'unused').length || 0;
      const activeVouchers = vouchers?.filter(v => v.status === 'active').length || 0;

      // Running month: revenue from completed payments
      const totalRevenue = transactions?.filter(t => t.status === 'completed' && t.type === 'payment').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Running month: connection fee (users connected this month)
      const monthStartDate = monthStart.slice(0, 10);
      const monthEndDate = monthEnd.slice(0, 10);
      const totalConnectionFee = users?.filter(u => {
        const d = u.connection_date;
        if (!d) return false;
        return d >= monthStartDate && d <= monthEndDate;
      }).reduce((sum, u) => sum + (u.connection_fee || 0), 0) || 0;

      // Running month: auto renew bill
      const autoRenewBill = transactions?.filter(t => t.is_auto_generated === true && t.status === 'completed').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Running month: extra income
      const totalExtraIncome = incomeData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      return {
        totalUsers,
        activeUsers,
        expiredUsers,
        suspendedUsers,
        disabledUsers,
        freeUsers,
        alreadyPaidUsers,
        totalVouchers,
        unusedVouchers,
        activeVouchers,
        totalRevenue,
        totalDataUsedMB,
        totalBill,
        activeUsersBill,
        expiredUsersBill,
        alreadyPaidBill,
        totalConnectionFee,
        totalExtraIncome,
        autoRenewUsers,
        autoRenewBill,
        pendingRequests,
      };
    },
    refetchInterval: 30000,
  });
}