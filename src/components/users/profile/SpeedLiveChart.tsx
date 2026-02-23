import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { useUserSpeedChart } from '@/hooks/useUserSpeedChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Gauge, RefreshCw, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

interface SpeedLiveChartProps {
  userId: string;
}

const chartConfig = {
  download: {
    label: 'Download',
    color: 'hsl(var(--primary))',
  },
  upload: {
    label: 'Upload',
    color: 'hsl(var(--chart-2))',
  },
};

function formatSpeed(mbps: number): string {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(1)} Gbps`;
  }
  return `${mbps.toFixed(1)} Mbps`;
}

export function SpeedLiveChart({ userId }: SpeedLiveChartProps) {
  const { data: speedData, isLoading, isFetching } = useUserSpeedChart(userId);
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['user-speed-chart', userId] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Speed Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasSpeed = (speedData?.downloadSpeedMbps || 0) > 0 || (speedData?.uploadSpeedMbps || 0) > 0;

  const barData = [
    { 
      name: 'Download', 
      speed: speedData?.downloadSpeedMbps || 0, 
      color: 'hsl(var(--primary))',
      icon: ArrowDown,
    },
    { 
      name: 'Upload', 
      speed: speedData?.uploadSpeedMbps || 0, 
      color: 'hsl(var(--chart-2))',
      icon: ArrowUp,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="w-5 h-5 text-primary" />
          Speed Allocation
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
        {hasSpeed ? (
          <div className="space-y-4">
            {/* Speed Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ArrowDown className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Download</span>
                </div>
                <p className="text-2xl font-bold font-mono text-primary">
                  {formatSpeed(speedData?.downloadSpeedMbps || 0)}
                </p>
              </div>
              <div className="bg-[hsl(var(--chart-2))]/10 rounded-lg p-4 text-center border border-[hsl(var(--chart-2))]/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ArrowUp className="w-5 h-5 text-[hsl(var(--chart-2))]" />
                  <span className="text-sm font-medium text-muted-foreground">Upload</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[hsl(var(--chart-2))]">
                  {formatSpeed(speedData?.uploadSpeedMbps || 0)}
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            <ChartContainer config={chartConfig} className="h-[120px] w-full">
              <BarChart 
                data={barData} 
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis 
                  type="number" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `${value} Mbps`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  width={70}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [`${formatSpeed(value)}`, '']}
                />
                <Bar 
                  dataKey="speed" 
                  radius={[0, 4, 4, 0]}
                  barSize={28}
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            {/* Plan Info */}
            {speedData?.planName && (
              <div className="text-center pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Based on plan: <span className="font-medium text-foreground">{speedData.planName}</span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <Gauge className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No speed data available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Assign a billing plan to see speed allocation</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
