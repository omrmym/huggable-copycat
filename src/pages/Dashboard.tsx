import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentUsersTable } from '@/components/dashboard/RecentUsersTable';
import { UserStatusChart } from '@/components/dashboard/UserStatusChart';
import { MonthlyBillCollectionChart } from '@/components/dashboard/MonthlyBillCollectionChart';
import { DailyBillCollectionChart } from '@/components/dashboard/DailyBillCollectionChart';
import { MonthlyPaidUsersChart } from '@/components/dashboard/MonthlyPaidUsersChart';
import { DailyNewUsersChart } from '@/components/dashboard/DailyNewUsersChart';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useRadiusUsers } from '@/hooks/useRadiusUsers';
import { Users, Wifi, UserX, UserCheck, CreditCard, Receipt, BadgeDollarSign, Clock, Cable, PlusCircle, UserMinus, RefreshCw, ClipboardList, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/utils';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useSmsBalance } from '@/hooks/useSmsBalance';

export default function Dashboard() {
  const { hasPermission, hasAnyPermission, isLoading: permissionsLoading } = useHasPermission();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: users = [], isLoading: usersLoading } = useRadiusUsers();
  const { data: smsBalanceData, isLoading: smsBalanceLoading } = useSmsBalance();

  const formatDataSize = (mb: number) => {
    if (mb >= 1024 * 1024) {
      return `${(mb / (1024 * 1024)).toFixed(1)} TB`;
    }
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const userStatsPermissions = [
    'dashboard.total_users',
    'dashboard.active_users',
    'dashboard.free_users',
    'dashboard.expired_users',
    'dashboard.disabled_users',
    'dashboard.already_paid',
    'dashboard.auto_renew_users',
    'dashboard.pending_requests',
  ];

  const billingStatsPermissions = [
    'dashboard.total_bill',
    'dashboard.active_users_bill',
    'dashboard.expired_users_bill',
    'dashboard.already_paid_bill',
    'dashboard.connection_fee',
    'dashboard.extra_income',
    'dashboard.auto_renew_bill',
  ];

  const canViewUserStats = hasAnyPermission(userStatsPermissions);
  const canViewBillingStats = hasAnyPermission(billingStatsPermissions);

  // Get users created today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newUsersToday = users.filter(u => new Date(u.created_at) >= today).length;

  // Map users to the format expected by RecentUsersTable
  const recentUsers = users.slice(0, 10).map(user => ({
    id: user.id,
    fullName: user.full_name || user.username,
    username: user.username,
    email: user.email || '',
    status: user.status,
    serviceType: user.service_type,
    planId: user.plan_id || '',
    dataUsed: user.data_used_mb,
    dataLimit: user.plan?.data_limit_mb ?? null,
  }));

  if (permissionsLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Overview of your network">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of your network">
      {/* User Stats Grid */}
      {canViewUserStats && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">User Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {statsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))
            ) : (
              <>
                {hasPermission('dashboard.total_users') && <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} variant="primary" href="/users" />}
                {hasPermission('dashboard.active_users') && <StatCard title="Active Users" value={stats?.activeUsers || 0} icon={Wifi} variant="success" href="/users?status=active" />}
                {hasPermission('dashboard.free_users') && <StatCard title="Free Users" value={stats?.freeUsers || 0} icon={Clock} variant="warning" href="/users?billing=free" />}
                {hasPermission('dashboard.expired_users') && <StatCard title="Expired Users" value={stats?.expiredUsers || 0} icon={UserX} href="/users?status=expired" />}
                {hasPermission('dashboard.disabled_users') && <StatCard title="Disabled Users" value={stats?.disabledUsers || 0} icon={UserMinus} href="/users?status=disabled" />}
                {hasPermission('dashboard.already_paid') && <StatCard title="Already Paid" value={stats?.alreadyPaidUsers || 0} icon={UserCheck} variant="success" href="/users?billing=paid" />}
                {hasPermission('dashboard.auto_renew_users') && <StatCard title="Auto Renew Users" value={stats?.autoRenewUsers || 0} icon={RefreshCw} variant="primary" href="/users?billing=auto_renew" />}
                {hasPermission('dashboard.pending_requests') && <StatCard title="Pending Requests" value={stats?.pendingRequests || 0} icon={ClipboardList} variant="warning" href="/users/requests" />}
              </>
            )}
          </div>
        </div>
      )}

      {/* Bill Stats Grid */}
      {canViewBillingStats && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Billing Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {statsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))
            ) : (
              <>
                {hasPermission('dashboard.total_bill') && <StatCard title="Total Bill" value={formatBDT(stats?.totalBill || 0)} icon={Receipt} variant="primary" href="/recharge/statistics" />}
                {hasPermission('dashboard.active_users_bill') && <StatCard title="Active Users Bill" value={formatBDT(stats?.activeUsersBill || 0)} icon={BadgeDollarSign} variant="success" href="/recharge/statistics?status=active" />}
                {hasPermission('dashboard.expired_users_bill') && <StatCard title="Expired Users Bill" value={formatBDT(stats?.expiredUsersBill || 0)} icon={CreditCard} variant="warning" href="/recharge/statistics?status=expired" />}
                {hasPermission('dashboard.already_paid_bill') && <StatCard title="Already Paid Bill" value={formatBDT(stats?.alreadyPaidBill || 0)} icon={CreditCard} variant="success" href="/recharge/manage" />}
                {hasPermission('dashboard.connection_fee') && <StatCard title="Connection Fee" value={formatBDT(stats?.totalConnectionFee || 0)} icon={Cable} variant="primary" href="/users" />}
                {hasPermission('dashboard.extra_income') && <StatCard title="Extra Income" value={formatBDT(stats?.totalExtraIncome || 0)} icon={PlusCircle} variant="success" href="/finance/income" />}
                {hasPermission('dashboard.auto_renew_bill') && <StatCard title="Auto Renew Bill" value={formatBDT(stats?.autoRenewBill || 0)} icon={RefreshCw} variant="success" href="/recharge/statistics?billing=auto_renew" />}
                <StatCard 
                  title="SMS Balance" 
                  value={smsBalanceLoading ? '...' : (smsBalanceData?.balance != null ? `৳${smsBalanceData.balance}` : 'N/A')} 
                  icon={MessageSquare} 
                  variant="primary" 
                  href="/sms-history" 
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      {(hasPermission('dashboard.monthly_bill_collection') || hasPermission('dashboard.daily_bill_collection')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {hasPermission('dashboard.monthly_bill_collection') && <MonthlyBillCollectionChart />}
          {hasPermission('dashboard.daily_bill_collection') && <DailyBillCollectionChart />}
        </div>
      )}

      {/* Charts Row 2 */}
      {(hasPermission('dashboard.monthly_paid_users') || hasPermission('dashboard.day_wise_new_line')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {hasPermission('dashboard.monthly_paid_users') && <MonthlyPaidUsersChart />}
          {hasPermission('dashboard.day_wise_new_line') && <DailyNewUsersChart />}
        </div>
      )}

      {/* User Status Chart */}
      {hasPermission('dashboard.online_offline_status') && (
        <div className="mb-6">
          <UserStatusChart />
        </div>
      )}

      {/* Recent Users Table */}
      {hasPermission('dashboard.recent_users') && <RecentUsersTable users={recentUsers} isLoading={usersLoading} />}
    </DashboardLayout>
  );
}