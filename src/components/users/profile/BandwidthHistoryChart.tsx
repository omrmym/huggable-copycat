import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAggregatedBandwidthHistory } from '@/hooks/useBandwidthHistory';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { History, RefreshCw, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface BandwidthHistoryChartProps {
  userId: string;
  username: string;
}

export function BandwidthHistoryChart({ userId, username }: BandwidthHistoryChartProps) {
  const [timeRange, setTimeRange] = useState<24 | 48 | 168>(24); // 24h, 48h, 7 days
  const { data, rawData, stats, isLoading, refetch } = useAggregatedBandwidthHistory(userId, timeRange);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes.toFixed(2)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  // Use stats from the hook for accurate totals
  const totalDownload = stats.totalBytesIn;
  const totalUpload = stats.totalBytesOut;
  const avgDownloadRate = stats.avgDownloadMbps;
  const avgUploadRate = stats.avgUploadMbps;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-500">
              ↓ Download: {payload[0]?.value?.toFixed(2)} Mbps
            </p>
            <p className="text-blue-500">
              ↑ Upload: {payload[1]?.value?.toFixed(2)} Mbps
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Bandwidth Usage History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={timeRange === 24 ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setTimeRange(24)}
              >
                24h
              </Button>
              <Button
                variant={timeRange === 48 ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3 border-x border-border"
                onClick={() => setTimeRange(48)}
              >
                48h
              </Button>
              <Button
                variant={timeRange === 168 ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setTimeRange(168)}
              >
                7d
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Historical bandwidth patterns for @{username}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[250px] w-full" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
            <Clock className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No Historical Data</p>
            <p className="text-sm">
              Bandwidth history will appear once the user has active sessions
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chart */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value.toFixed(1)}`}
                    label={{
                      value: 'Mbps',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="avgDownload"
                    name="Download"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#downloadGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="avgUpload"
                    name="Upload"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#uploadGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Total Download</span>
                </div>
                <p className="text-xl font-bold font-mono text-green-500">
                  {formatBytes(totalDownload)}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Upload</span>
                </div>
                <p className="text-xl font-bold font-mono text-blue-500">
                  {formatBytes(totalUpload)}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Avg Download</span>
                </div>
                <p className="text-xl font-bold font-mono text-green-500">
                  {avgDownloadRate.toFixed(2)} Mbps
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Avg Upload</span>
                </div>
                <p className="text-xl font-bold font-mono text-blue-500">
                  {avgUploadRate.toFixed(2)} Mbps
                </p>
              </div>
            </div>

            {/* Data points info */}
            <p className="text-xs text-muted-foreground text-center">
              Based on {stats.dataPoints} data points over the last {timeRange} hours
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
