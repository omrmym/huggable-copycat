import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Users,
  Download,
  Calendar,
  DollarSign,
  HardDrive,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useRadiusUsers } from '@/hooks/useRadiusUsers';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: users = [] } = useRadiusUsers();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDataSize = (mb: number) => {
    if (mb >= 1024 * 1024) {
      return `${(mb / (1024 * 1024)).toFixed(1)} TB`;
    }
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  // Calculate user distribution by service type
  const hotspotUsers = users.filter(u => u.service_type === 'hotspot').length;
  const pppoeUsers = users.filter(u => u.service_type === 'pppoe').length;

  return (
    <DashboardLayout title="Reports" subtitle="Analytics and usage reports">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          <Select defaultValue="30">
            <SelectTrigger className="w-40 bg-card border-border">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Button variant="outline" className="border-border">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardDescription>
            <CardTitle className="text-2xl">
              {statsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats?.totalRevenue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-success">
              <TrendingUp className="w-4 h-4" />
              <span>+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Subscribers
            </CardDescription>
            <CardTitle className="text-2xl">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.activeUsers || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-success">
              <TrendingUp className="w-4 h-4" />
              <span>+5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Data Usage
            </CardDescription>
            <CardTitle className="text-2xl">
              {statsLoading ? <Skeleton className="h-8 w-20" /> : formatDataSize(stats?.totalDataUsedMB || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total bandwidth consumed</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Vouchers Sold
            </CardDescription>
            <CardTitle className="text-2xl">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.activeVouchers || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Active vouchers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">PPPoE Users</span>
                  <span className="font-medium">{pppoeUsers}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: users.length > 0 ? `${(pppoeUsers / users.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hotspot Users</span>
                  <span className="font-medium">{hotspotUsers}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full"
                    style={{ width: users.length > 0 ? `${(hotspotUsers / users.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>User Status</CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium text-success">{stats?.activeUsers || 0}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{ width: stats?.totalUsers ? `${(stats.activeUsers / stats.totalUsers) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expired</span>
                  <span className="font-medium text-warning">{stats?.expiredUsers || 0}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full"
                    style={{ width: stats?.totalUsers ? `${(stats.expiredUsers / stats.totalUsers) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Suspended</span>
                  <span className="font-medium text-destructive">{stats?.suspendedUsers || 0}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-destructive rounded-full"
                    style={{ width: stats?.totalUsers ? `${(stats.suspendedUsers / stats.totalUsers) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>Generate and download reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="border-border justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-medium">User Report</p>
                <p className="text-xs text-muted-foreground">All users with status</p>
              </div>
            </Button>
            <Button variant="outline" className="border-border justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-medium">Revenue Report</p>
                <p className="text-xs text-muted-foreground">Transactions summary</p>
              </div>
            </Button>
            <Button variant="outline" className="border-border justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-medium">Usage Report</p>
                <p className="text-xs text-muted-foreground">Data consumption</p>
              </div>
            </Button>
            <Button variant="outline" className="border-border justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-medium">Voucher Report</p>
                <p className="text-xs text-muted-foreground">Voucher statistics</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}