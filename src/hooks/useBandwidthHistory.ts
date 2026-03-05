import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BandwidthHistoryEntry {
  id: string;
  radius_user_id: string;
  bytes_in: number;
  bytes_out: number;
  download_rate_bps: number;
  upload_rate_bps: number;
  session_uptime: string | null;
  recorded_at: string;
}

export interface AggregatedBandwidthData {
  hour: string;
  label: string;
  avgDownload: number;
  avgUpload: number;
  totalBytesIn: number;
  totalBytesOut: number;
  dataPoints: number;
}

export function useBandwidthHistory(userId: string | undefined, hours: number = 24) {
  return useQuery({
    queryKey: ['bandwidth-history', userId, hours],
    queryFn: async (): Promise<BandwidthHistoryEntry[]> => {
      if (!userId) return [];

      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const { data, error } = await supabase
        .from('bandwidth_history')
        .select('*')
        .eq('radius_user_id', userId)
        .gte('recorded_at', startTime.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error('Error fetching bandwidth history:', error);
        return [];
      }

      return (data || []) as BandwidthHistoryEntry[];
    },
    enabled: !!userId,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useAggregatedBandwidthHistory(userId: string | undefined, hours: number = 24) {
  const { data: rawData, isLoading, error, refetch } = useBandwidthHistory(userId, hours);

  const aggregatedData: AggregatedBandwidthData[] = [];
  
  // Calculate overall totals from raw data for stats
  let overallTotalBytesIn = 0;
  let overallTotalBytesOut = 0;
  let overallTotalDownloadRate = 0;
  let overallTotalUploadRate = 0;
  let rateDataPoints = 0;

  if (rawData && rawData.length > 0) {
    // Group data by hour
    const hourlyGroups = new Map<string, BandwidthHistoryEntry[]>();

    rawData.forEach((entry) => {
      const date = new Date(entry.recorded_at);
      const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      
      if (!hourlyGroups.has(hourKey)) {
        hourlyGroups.set(hourKey, []);
      }
      hourlyGroups.get(hourKey)!.push(entry);
      
      // Accumulate rates for overall average
      if (entry.download_rate_bps > 0 || entry.upload_rate_bps > 0) {
        // MikroTik bytes-in = user upload, bytes-out = user download, so swap
        overallTotalDownloadRate += entry.upload_rate_bps;
        overallTotalUploadRate += entry.download_rate_bps;
        rateDataPoints++;
      }
    });

    // Calculate totals from first and last record (cumulative session traffic)
    if (rawData.length > 0) {
      const lastRecord = rawData[rawData.length - 1];
      const firstRecord = rawData[0];
      
      // Total is the difference between last and first record for the period
      // If there's only one record, use its values directly
      // MikroTik bytes-in = user upload, bytes-out = user download, so swap
      overallTotalBytesIn = lastRecord.bytes_out;
      overallTotalBytesOut = lastRecord.bytes_in;
    }

    // Calculate averages for each hour
    hourlyGroups.forEach((entries, hourKey) => {
      // Use the stored rates from database
      const avgDownloadBps = entries.reduce((sum, e) => sum + e.download_rate_bps, 0) / entries.length;
      const avgUploadBps = entries.reduce((sum, e) => sum + e.upload_rate_bps, 0) / entries.length;
      
      // Get the last record's bytes for that hour (cumulative traffic)
      const lastEntry = entries[entries.length - 1];
      const firstEntry = entries[0];
      const hourlyBytesIn = lastEntry.bytes_in - firstEntry.bytes_in;
      const hourlyBytesOut = lastEntry.bytes_out - firstEntry.bytes_out;

      const date = new Date(hourKey);
      const label = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

      aggregatedData.push({
        hour: hourKey,
        label,
        avgDownload: avgDownloadBps / 1024 / 1024 * 8, // Convert Bps to Mbps
        avgUpload: avgUploadBps / 1024 / 1024 * 8, // Convert Bps to Mbps
        totalBytesIn: hourlyBytesIn > 0 ? hourlyBytesIn : 0,
        totalBytesOut: hourlyBytesOut > 0 ? hourlyBytesOut : 0,
        dataPoints: entries.length,
      });
    });

    // Sort by time
    aggregatedData.sort((a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime());
  }

  return {
    data: aggregatedData,
    rawData,
    isLoading,
    error,
    refetch,
    // Include overall stats
    stats: {
      totalBytesIn: overallTotalBytesIn,
      totalBytesOut: overallTotalBytesOut,
      avgDownloadMbps: rateDataPoints > 0 ? (overallTotalDownloadRate / rateDataPoints) / 1024 / 1024 * 8 : 0,
      avgUploadMbps: rateDataPoints > 0 ? (overallTotalUploadRate / rateDataPoints) / 1024 / 1024 * 8 : 0,
      dataPoints: rawData?.length || 0,
    },
  };
}
