import { Link } from 'react-router-dom';
import { Users, Wifi, UserX, UserCheck, Clock, UserMinus, CreditCard, Receipt, BadgeDollarSign, Cable, TrendingUp, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBDT } from '@/lib/utils';

interface ResellerStatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  href?: string;
}

function ResellerStatCard({ title, value, icon: Icon, variant = 'default', href }: ResellerStatCardProps) {
  const variantStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };

  const content = (
    <div className={`bg-card border border-border rounded-xl p-4 h-full transition-colors ${href ? 'hover:bg-muted/50 cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${variantStyles[variant]}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${variantStyles[variant]} opacity-80`} />
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

interface ResellerStatCardsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    expiredUsers: number;
    disabledUsers: number;
    freeUsers: number;
    alreadyPaidUsers: number;
    totalBill: number;
    activeUsersBill: number;
    expiredUsersBill: number;
    alreadyPaidBill: number;
    totalConnectionFee: number;
    totalRecharges: number;
    totalCommission: number;
    autoRenewUsers: number;
    autoRenewBill: number;
  } | undefined;
  isLoading: boolean;
}

export function ResellerStatCards({ stats, isLoading }: ResellerStatCardsProps) {
  if (isLoading) {
    return (
      <>
        {/* User Stats Grid */}
        <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">User Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Bill Stats Grid */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Billing Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* User Stats Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">User Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <ResellerStatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            variant="primary"
            href="/reseller/users"
          />
          <ResellerStatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={Wifi}
            variant="success"
            href="/reseller/users?status=active"
          />
          <ResellerStatCard
            title="Free Users"
            value={stats?.freeUsers || 0}
            icon={Clock}
            variant="warning"
            href="/reseller/users?billing=free"
          />
          <ResellerStatCard
            title="Expired Users"
            value={stats?.expiredUsers || 0}
            icon={UserX}
            href="/reseller/users?status=expired"
          />
          <ResellerStatCard
            title="Disabled Users"
            value={stats?.disabledUsers || 0}
            icon={UserMinus}
            href="/reseller/users?status=disabled"
          />
          <ResellerStatCard
            title="Already Paid"
            value={stats?.alreadyPaidUsers || 0}
            icon={UserCheck}
            variant="success"
            href="/reseller/users?billing=paid"
          />
          <ResellerStatCard
            title="Auto Renew Users"
            value={stats?.autoRenewUsers || 0}
            icon={RefreshCw}
            variant="primary"
            href="/reseller/users?billing=auto_renew"
          />
        </div>
      </div>

      {/* Bill Stats Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Billing Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <ResellerStatCard
            title="Total Bill"
            value={formatBDT(stats?.totalBill || 0)}
            icon={Receipt}
            variant="primary"
            href="/reseller/recharge/statistics"
          />
          <ResellerStatCard
            title="Active Users Bill"
            value={formatBDT(stats?.activeUsersBill || 0)}
            icon={BadgeDollarSign}
            variant="success"
            href="/reseller/recharge/statistics?status=active"
          />
          <ResellerStatCard
            title="Expired Users Bill"
            value={formatBDT(stats?.expiredUsersBill || 0)}
            icon={CreditCard}
            variant="warning"
            href="/reseller/recharge/statistics?status=expired"
          />
          <ResellerStatCard
            title="Already Paid Bill"
            value={formatBDT(stats?.alreadyPaidBill || 0)}
            icon={CreditCard}
            variant="success"
            href="/reseller/recharge/statistics?paid=true"
          />
          <ResellerStatCard
            title="Connection Fee"
            value={formatBDT(stats?.totalConnectionFee || 0)}
            icon={Cable}
            variant="primary"
            href="/reseller/users"
          />
          <ResellerStatCard
            title="Total Earnings"
            value={formatBDT(stats?.totalCommission || 0)}
            icon={TrendingUp}
            variant="success"
            href="/reseller/recharge/manage"
          />
          <ResellerStatCard
            title="Auto Renew Bill"
            value={formatBDT(stats?.autoRenewBill || 0)}
            icon={RefreshCw}
            variant="success"
            href="/reseller/recharge/statistics?billing=auto_renew"
          />
        </div>
      </div>
    </>
  );
}
