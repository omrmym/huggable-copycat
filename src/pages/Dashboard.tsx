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
import { Users, Wifi, UserX, UserCheck, CreditCard, Receipt, BadgeDollarSign, Clock, Cable, PlusCircle, UserMinus, RefreshCw, ClipboardList } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/utils';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: users = [], isLoading: usersLoading } = useRadiusUsers();

  const formatDataSize = (mb: number) => {
    if (mb >= 1024 * 1024) {
      return `${(mb / (1024 * 1024)).toFixed(1)} TB`;
    }
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

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

  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of your network">
      {/* User Stats Grid */}
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
              <StatCard
                title="Total Users"
                value={stats?.totalUsers || 0}
                icon={Users}
                variant="primary"
                href="/users"
              />
              <StatCard
                title="Active Users"
                value={stats?.activeUsers || 0}
                icon={Wifi}
                variant="success"
                href="/users?status=active"
              />
              <StatCard
                title="Free Users"
                value={stats?.freeUsers || 0}
                icon={Clock}
                variant="warning"
                href="/users?billing=free"
              />
              <StatCard
                title="Expired Users"
                value={stats?.expiredUsers || 0}
                icon={UserX}
                href="/users?status=expired"
              />
              <StatCard
                title="Disabled Users"
                value={stats?.disabledUsers || 0}
                icon={UserMinus}
                href="/users?status=disabled"
              />
              <StatCard
                title="Already Paid"
                value={stats?.alreadyPaidUsers || 0}
                icon={UserCheck}
                variant="success"
                href="/users?billing=paid"
              />
              <StatCard
                title="Auto Renew Users"
                value={stats?.autoRenewUsers || 0}
                icon={RefreshCw}
                variant="primary"
                href="/users?billing=auto_renew"
              />
              <StatCard
                title="Pending Requests"
                value={stats?.pendingRequests || 0}
                icon={ClipboardList}
                variant="warning"
                href="/users/requests"
              />
            </>
          )}
        </div>
      </div>

      {/* Bill Stats Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Billing Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Total Bill"
                value={formatBDT(stats?.totalBill || 0)}
                icon={Receipt}
                variant="primary"
                href="/recharge/statistics"
              />
              <StatCard
                title="Active Users Bill"
                value={formatBDT(stats?.activeUsersBill || 0)}
                icon={BadgeDollarSign}
                variant="success"
                href="/recharge/statistics?status=active"
              />
              <StatCard
                title="Expired Users Bill"
                value={formatBDT(stats?.expiredUsersBill || 0)}
                icon={CreditCard}
                variant="warning"
                href="/recharge/statistics?status=expired"
              />
              <StatCard
                title="Already Paid Bill"
                value={formatBDT(stats?.alreadyPaidBill || 0)}
                icon={CreditCard}
                variant="success"
                href="/recharge/statistics?paid=true"
              />
              <StatCard
                title="Connection Fee"
                value={formatBDT(stats?.totalConnectionFee || 0)}
                icon={Cable}
                variant="primary"
                href="/users"
              />
              <StatCard
                title="Extra Income"
                value={formatBDT(stats?.totalExtraIncome || 0)}
                icon={PlusCircle}
                variant="success"
                href="/finance/income"
              />
              <StatCard
                title="Auto Renew Bill"
                value={formatBDT(stats?.autoRenewBill || 0)}
                icon={RefreshCw}
                variant="success"
                href="/recharge/statistics?billing=auto_renew"
              />
            </>
          )}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MonthlyBillCollectionChart />
        <DailyBillCollectionChart />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MonthlyPaidUsersChart />
        <DailyNewUsersChart />
      </div>

      {/* User Status Chart */}
      <div className="mb-6">
        <UserStatusChart />
      </div>

      {/* Recent Users Table */}
      <RecentUsersTable users={recentUsers} isLoading={usersLoading} />
    </DashboardLayout>
  );
}