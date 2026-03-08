import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, TrendingUp, Calendar, Activity, Loader2, Clock } from 'lucide-react';
import { useUserDataUsageChart } from '@/hooks/useUserDataUsageChart';
import { format } from 'date-fns';

interface DataUsageTabProps {
  user: {
    id: string;
    data_used_mb: number;
    data_limit_mb?: number | null;
    plan?: {
      data_limit_mb: number | null;
    } | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    reseller_office: string | null;
  };
}

export function DataUsageTab({ user }: DataUsageTabProps) {
  const { data: liveData, isLoading: liveLoading } = useUserDataUsageChart(user.id);

  // Use live data if available, otherwise fall back to static user data
  const dataUsedMb = liveData?.dataUsedMb ?? user.data_used_mb;
  const fallbackLimit = user.data_limit_mb ?? user.plan?.data_limit_mb ?? null;
  const dataLimit = liveData?.dataLimitMb ?? fallbackLimit;
  const usagePercentage = dataLimit ? Math.min((dataUsedMb / dataLimit) * 100, 100) : 0;

  const cycleStart = liveData?.cycleStart ? new Date(liveData.cycleStart) : null;
  const cycleEnd = liveData?.cycleEnd ? new Date(liveData.cycleEnd) : null;
  const durationDays = liveData?.durationDays ?? null;

  // Calculate days remaining in cycle
  const now = new Date();
  const daysRemaining = cycleEnd ? Math.max(Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0) : null;

  return (
    <div className="space-y-6">
      {/* Billing Cycle Info */}
      {cycleStart && cycleEnd && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-foreground">Current Billing Cycle</h4>
              {durationDays && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {durationDays} Days Cycle
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Cycle Start</p>
                <p className="font-medium text-sm">{format(cycleStart, 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cycle End</p>
                <p className="font-medium text-sm">{format(cycleEnd, 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days Remaining</p>
                <p className={`font-bold text-sm ${daysRemaining !== null && daysRemaining <= 3 ? 'text-destructive' : 'text-primary'}`}>
                  {daysRemaining !== null ? `${daysRemaining} Days` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Data Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Data Usage Overview
            <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground ml-auto">
              {liveLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
              Live
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <p className="text-4xl font-bold font-mono text-primary transition-all">
                {(dataUsedMb / 1024).toFixed(2)} GB
              </p>
              <p className="text-muted-foreground mt-2">
                {dataLimit 
                  ? `of ${(dataLimit / 1024).toFixed(2)} GB used`
                  : 'Unlimited data plan'
                }
              </p>
              {liveData?.planName && (
                <p className="text-xs text-muted-foreground mt-1">Plan: {liveData.planName}</p>
              )}
              {cycleStart && cycleEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cycle: {format(cycleStart, 'dd MMM')} - {format(cycleEnd, 'dd MMM yyyy')}
                </p>
              )}
            </div>

            {dataLimit && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      usagePercentage > 90 
                        ? 'bg-destructive' 
                        : usagePercentage > 70 
                          ? 'bg-yellow-500' 
                          : 'bg-primary'
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {dataLimit - dataUsedMb > 0 
                    ? `${((dataLimit - dataUsedMb) / 1024).toFixed(2)} GB remaining`
                    : 'Data limit exceeded'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="font-medium mt-1">
                {user.last_login_at 
                  ? new Date(user.last_login_at).toLocaleDateString() 
                  : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Account Created</p>
              <p className="font-medium mt-1">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium mt-1">
                {new Date(user.updated_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <HardDrive className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Reseller Office</p>
              <p className="font-medium mt-1">{user.reseller_office || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage Details (Current Cycle)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Data Used (This Cycle)</span>
              <span className="font-mono font-medium">
                {(dataUsedMb / 1024).toFixed(2)} GB ({dataUsedMb.toLocaleString()} MB)
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Data Limit</span>
              <span className="font-mono font-medium">
                {dataLimit 
                  ? `${(dataLimit / 1024).toFixed(2)} GB (${dataLimit.toLocaleString()} MB)`
                  : 'Unlimited'
                }
              </span>
            </div>
            {cycleStart && cycleEnd && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Billing Period</span>
                <span className="font-medium">
                  {format(cycleStart, 'dd MMM yyyy')} — {format(cycleEnd, 'dd MMM yyyy')}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-medium ${
                !dataLimit || dataUsedMb < dataLimit * 0.9 
                  ? 'text-green-500' 
                  : 'text-destructive'
              }`}>
                {!dataLimit 
                  ? 'Unlimited Plan'
                  : dataUsedMb >= dataLimit 
                    ? 'Limit Exceeded'
                    : dataUsedMb >= dataLimit * 0.9 
                      ? 'Near Limit'
                      : 'Normal'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}