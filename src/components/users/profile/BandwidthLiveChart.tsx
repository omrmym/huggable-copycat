import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserBandwidth, BandwidthData } from '@/hooks/useUserBandwidth';
import { Skeleton } from '@/components/ui/skeleton';
import { Wifi, WifiOff, RefreshCw, ArrowDown, ArrowUp, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface BandwidthLiveChartProps {
  userId: string;
  username: string;
  serviceType: 'hotspot' | 'pppoe';
  routerId: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(uptime: string | undefined): string {
  if (!uptime) return '-';
  // MikroTik format: 1d2h3m4s or 2h3m4s etc.
  return uptime;
}

export function BandwidthLiveChart({ userId, username, serviceType, routerId }: BandwidthLiveChartProps) {
  const { data: bandwidthData, isLoading, isFetching, error } = useUserBandwidth(
    userId,
    username,
    serviceType,
    routerId
  );
  const queryClient = useQueryClient();
  
  // Track bandwidth history for the chart
  const [history, setHistory] = useState<{ time: string; download: number; upload: number }[]>([]);
  const [prevData, setPrevData] = useState<BandwidthData | null>(null);

  useEffect(() => {
    if (bandwidthData && bandwidthData.isOnline) {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Calculate rate (bytes per second) based on difference from previous reading
      let downloadRate = 0;
      let uploadRate = 0;
      
      if (prevData && prevData.isOnline) {
        const timeDiff = (bandwidthData.lastUpdated.getTime() - prevData.lastUpdated.getTime()) / 1000;
        if (timeDiff > 0) {
          downloadRate = Math.max(0, (bandwidthData.bytesIn - prevData.bytesIn) / timeDiff);
          uploadRate = Math.max(0, (bandwidthData.bytesOut - prevData.bytesOut) / timeDiff);
        }
      }
      
      setHistory(prev => {
        const newHistory = [...prev, { 
          time: now, 
          download: downloadRate, 
          upload: uploadRate 
        }];
        // Keep last 12 data points (1 minute of data at 5s intervals)
        return newHistory.slice(-12);
      });
      
      setPrevData(bandwidthData);
    }
  }, [bandwidthData]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['user-bandwidth', userId, username] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Live Bandwidth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const isOnline = bandwidthData?.isOnline || false;
  const latestDownloadRate = history.length > 0 ? history[history.length - 1].download : 0;
  const latestUploadRate = history.length > 0 ? history[history.length - 1].upload : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-primary" />
          ) : (
            <WifiOff className="w-5 h-5 text-muted-foreground" />
          )}
          Live Bandwidth
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'default' : 'secondary'} className={isOnline ? 'bg-primary' : ''}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-primary' : 'bg-muted-foreground'} ${isOnline ? 'animate-pulse' : ''}`} />
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
        {isOnline ? (
          <div className="space-y-4">
            {/* Real-time Speed Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ArrowDown className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Download</span>
                </div>
                <p className="text-2xl font-bold font-mono text-primary">
                  {formatBytes(latestDownloadRate)}/s
                </p>
              </div>
              <div className="bg-[hsl(var(--chart-2))]/10 rounded-lg p-4 text-center border border-[hsl(var(--chart-2))]/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ArrowUp className="w-5 h-5 text-[hsl(var(--chart-2))]" />
                  <span className="text-sm font-medium text-muted-foreground">Upload</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[hsl(var(--chart-2))]">
                  {formatBytes(latestUploadRate)}/s
                </p>
              </div>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <ArrowDown className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold font-mono">{formatBytes(bandwidthData?.bytesIn || 0)}</p>
                <p className="text-xs text-muted-foreground">Total Downloaded</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <ArrowUp className="w-4 h-4 mx-auto mb-1 text-[hsl(var(--chart-2))]" />
                <p className="text-lg font-bold font-mono">{formatBytes(bandwidthData?.bytesOut || 0)}</p>
                <p className="text-xs text-muted-foreground">Total Uploaded</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold font-mono">{formatUptime(bandwidthData?.uptime)}</p>
                <p className="text-xs text-muted-foreground">Session Uptime</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <Globe className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold font-mono truncate" title={bandwidthData?.address}>
                  {bandwidthData?.address || '-'}
                </p>
                <p className="text-xs text-muted-foreground">IP Address</p>
              </div>
            </div>

            {/* Simple Bar Chart for History */}
            {history.length > 1 && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Bandwidth History (last 60s)</p>
                <div className="flex items-end gap-1 h-16">
                  {history.map((point, index) => {
                    const maxRate = Math.max(...history.map(h => Math.max(h.download, h.upload)), 1);
                    const downloadHeight = (point.download / maxRate) * 100;
                    const uploadHeight = (point.upload / maxRate) * 100;
                    
                    return (
                      <div key={index} className="flex-1 flex gap-0.5 items-end h-full">
                        <div 
                          className="flex-1 bg-primary rounded-t transition-all duration-300"
                          style={{ height: `${Math.max(downloadHeight, 2)}%` }}
                          title={`↓ ${formatBytes(point.download)}/s`}
                        />
                        <div 
                          className="flex-1 bg-[hsl(var(--chart-2))] rounded-t transition-all duration-300"
                          style={{ height: `${Math.max(uploadHeight, 2)}%` }}
                          title={`↑ ${formatBytes(point.upload)}/s`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Download</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <WifiOff className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">User is currently offline</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Bandwidth data will appear when the user connects
            </p>
            {error && (
              <p className="text-xs text-destructive mt-2">
                Connection error - check MikroTik configuration
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
