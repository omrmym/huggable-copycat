import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useUserDataUsageChart } from '@/hooks/useUserDataUsageChart';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, RefreshCw, Infinity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';

interface DataUsageLiveChartProps {
  userId: string;
}

const chartConfig = {
  used: {
    label: 'Used',
    color: 'hsl(var(--primary))',
  },
  remaining: {
    label: 'Remaining',
    color: 'hsl(var(--muted))',
  },
};

function formatDataSize(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}

export function DataUsageLiveChart({ userId }: DataUsageLiveChartProps) {
  const { data: usageData, isLoading, isFetching } = useUserDataUsageChart(userId);
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['user-data-usage-chart', userId] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Live Data Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasLimit = usageData?.dataLimitMb && usageData.dataLimitMb > 0;
  
  const pieData = hasLimit
    ? [
        { name: 'Used', value: usageData?.dataUsedMb || 0, color: 'hsl(var(--primary))' },
        { name: 'Remaining', value: usageData?.remainingMb || 0, color: 'hsl(var(--muted))' },
      ]
    : [
        { name: 'Used', value: usageData?.dataUsedMb || 0, color: 'hsl(var(--primary))' },
      ];

  // Determine color based on usage percentage
  const getUsageColor = () => {
    if (!hasLimit) return 'text-primary';
    const percentage = usageData?.percentageUsed || 0;
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-primary';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HardDrive className="w-5 h-5 text-primary" />
          Live Data Usage
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Pie Chart */}
          <div className="w-[180px] h-[180px] relative">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-2xl font-bold font-mono ${getUsageColor()}`}>
                {hasLimit ? `${usageData?.percentageUsed?.toFixed(0)}%` : formatDataSize(usageData?.dataUsedMb || 0)}
              </span>
              <span className="text-xs text-muted-foreground">
                {hasLimit ? 'Used' : 'Total Used'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-4 w-full">
            {/* Plan Info */}
            {usageData?.planName && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold">{usageData.planName}</p>
              </div>
            )}

            {/* Usage Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className={`text-xl font-bold font-mono ${getUsageColor()}`}>
                  {formatDataSize(usageData?.dataUsedMb || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Data Used</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                {hasLimit ? (
                  <>
                    <p className="text-xl font-bold font-mono text-primary">
                      {formatDataSize(usageData?.remainingMb || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </>
                ) : (
                  <>
                    <Infinity className="w-6 h-6 mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground">Unlimited</p>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar (only if has limit) */}
            {hasLimit && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 MB</span>
                  <span>{formatDataSize(usageData?.dataLimitMb || 0)}</span>
                </div>
                <Progress 
                  value={usageData?.percentageUsed || 0} 
                  className="h-3"
                />
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Data Used</span>
          </div>
          {hasLimit && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-xs text-muted-foreground">Remaining</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
