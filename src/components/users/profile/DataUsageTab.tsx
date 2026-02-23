import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, TrendingUp, Calendar, Activity } from 'lucide-react';

interface DataUsageTabProps {
  user: {
    data_used_mb: number;
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
  const formatDataUsage = (used: number, limit: number | null) => {
    const usedGB = (used / 1024).toFixed(2);
    if (limit === null) return `${usedGB} GB (Unlimited)`;
    const limitGB = (limit / 1024).toFixed(2);
    const percentage = Math.round((used / limit) * 100);
    return `${usedGB} / ${limitGB} GB (${percentage}%)`;
  };

  const dataLimit = user.plan?.data_limit_mb ?? null;
  const usagePercentage = dataLimit ? Math.min((user.data_used_mb / dataLimit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Main Data Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Data Usage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <p className="text-4xl font-bold font-mono text-primary">
                {(user.data_used_mb / 1024).toFixed(2)} GB
              </p>
              <p className="text-muted-foreground mt-2">
                {dataLimit 
                  ? `of ${(dataLimit / 1024).toFixed(2)} GB used`
                  : 'Unlimited data plan'
                }
              </p>
            </div>

            {dataLimit && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
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
                  {dataLimit - user.data_used_mb > 0 
                    ? `${((dataLimit - user.data_used_mb) / 1024).toFixed(2)} GB remaining`
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
          <CardTitle className="text-lg">Usage Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Total Data Used</span>
              <span className="font-mono font-medium">
                {(user.data_used_mb / 1024).toFixed(2)} GB ({user.data_used_mb.toLocaleString()} MB)
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
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-medium ${
                !dataLimit || user.data_used_mb < dataLimit * 0.9 
                  ? 'text-green-500' 
                  : 'text-destructive'
              }`}>
                {!dataLimit 
                  ? 'Unlimited Plan'
                  : user.data_used_mb >= dataLimit 
                    ? 'Limit Exceeded'
                    : user.data_used_mb >= dataLimit * 0.9 
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
