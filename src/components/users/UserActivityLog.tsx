import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Wifi, 
  WifiOff, 
  Filter,
  Download,
  Clock
} from 'lucide-react';
import { differenceInSeconds } from 'date-fns';
import { formatDate, formatDistanceToNowTz, toTimezone } from '@/lib/dateUtils';
import { useUserActivityLog, UserActivityLog as ActivityLogType } from '@/hooks/useUserActivityLog';
import { toast } from 'sonner';
import { writeExcelFile, writeCsvFile } from '@/lib/excelUtils';

interface UserActivityLogProps {
  userId: string;
  lastLoginAt: string | null;
  username?: string;
}

const ACTION_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'connect', label: 'Connected' },
  { value: 'disconnect', label: 'Disconnected' },
];

function getActionIcon(action: string) {
  switch (action.toLowerCase()) {
    case 'connect':
      return <Wifi className="w-4 h-4" />;
    case 'disconnect':
      return <WifiOff className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}

function getActionLabel(action: string) {
  const actionMap: Record<string, string> = {
    'connect': 'Connected', // Last Link Up Time from MikroTik interface
    'disconnect': 'Disconnected', // Last Logged Out from MikroTik Secrets
  };
  return actionMap[action.toLowerCase()] || action.replace(/_/g, ' ');
}

function isConnectAction(action: string): boolean {
  return action.toLowerCase() === 'connect';
}

function isDisconnectAction(action: string): boolean {
  return action.toLowerCase() === 'disconnect';
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

interface ActivityWithDuration extends ActivityLogType {
  sessionDuration?: number; // in seconds
  isOngoing?: boolean;
}

function calculateSessionDurations(activities: ActivityLogType[]): ActivityWithDuration[] {
  // Activities are sorted descending by created_at (newest first)
  const result: ActivityWithDuration[] = [];
  
  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];
    const activityWithDuration: ActivityWithDuration = { ...activity };
    
    if (isDisconnectAction(activity.action)) {
      // Find the matching connect event (should be the next older event that's a connect)
      for (let j = i + 1; j < activities.length; j++) {
        if (isConnectAction(activities[j].action)) {
          const connectTime = toTimezone(activities[j].created_at);
          const disconnectTime = toTimezone(activity.created_at);
          activityWithDuration.sessionDuration = differenceInSeconds(disconnectTime, connectTime);
          break;
        }
      }
    } else if (isConnectAction(activity.action)) {
      // Check if there's a disconnect event after this (in the newer entries)
      let hasDisconnect = false;
      for (let j = i - 1; j >= 0; j--) {
        if (isDisconnectAction(activities[j].action)) {
          hasDisconnect = true;
          break;
        }
        if (isConnectAction(activities[j].action)) {
          // Found another connect before finding disconnect - this session was interrupted
          break;
        }
      }
      
      if (!hasDisconnect && i === 0) {
        // This is the most recent event and it's a connect - session is ongoing
        const connectTime = toTimezone(activity.created_at);
        activityWithDuration.sessionDuration = differenceInSeconds(toTimezone(new Date()), connectTime);
        activityWithDuration.isOngoing = true;
      }
    }
    
    result.push(activityWithDuration);
  }
  
  return result;
}

export function UserActivityLog({ userId, lastLoginAt, username }: UserActivityLogProps) {
  const { data: activities = [], isLoading } = useUserActivityLog(userId);
  const [actionFilter, setActionFilter] = useState('all');

  // Calculate session durations
  const activitiesWithDuration = useMemo(() => {
    return calculateSessionDurations(activities);
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (actionFilter === 'all') return activitiesWithDuration;
    return activitiesWithDuration.filter(a => a.action.toLowerCase() === actionFilter);
  }, [activitiesWithDuration, actionFilter]);

  // Get unique action types from actual data for dynamic filter options
  const availableActions = useMemo(() => {
    const uniqueActions = new Set(activities.map(a => a.action.toLowerCase()));
    return ACTION_TYPES.filter(
      at => at.value === 'all' || uniqueActions.has(at.value)
    );
  }, [activities]);

  const handleExport = async (exportFormat: 'csv' | 'xlsx') => {
    if (filteredActivities.length === 0) {
      toast.error('No activities to export');
      return;
    }

    try {
      const exportData = filteredActivities.map((activity) => ({
        'Date & Time': formatDate(activity.created_at, 'yyyy-MM-dd HH:mm:ss'),
        'Action': getActionLabel(activity.action),
        'Action Code': activity.action,
        'Session Duration': activity.sessionDuration 
          ? (activity.isOngoing ? `${formatDuration(activity.sessionDuration)} (ongoing)` : formatDuration(activity.sessionDuration))
          : '',
        'Status': activity.success ? 'Success' : 'Failed',
        'Error Message': activity.error_message || '',
      }));

      const dateStr = formatDate(new Date(), 'yyyy-MM-dd');
      const filterSuffix = actionFilter !== 'all' ? `_${actionFilter}` : '';
      const userSuffix = username ? `_${username}` : '';
      const filename = `activity_log${userSuffix}${filterSuffix}_${dateStr}.${exportFormat}`;

      if (exportFormat === 'csv') {
        await writeCsvFile(exportData, filename, 'Activity Log');
      } else {
        await writeExcelFile(exportData, filename, 'Activity Log', [20, 20, 15, 18, 10, 40]);
      }

      toast.success(`Activity log exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export activity log');
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Activity Log
          </CardTitle>
          {activities.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  {availableActions.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  className="gap-1"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('xlsx')}
                  className="gap-1"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No activity recorded yet</p>
            {lastLoginAt && (
              <p className="text-sm mt-2">
                Last login: {formatDistanceToNowTz(lastLoginAt, { addSuffix: true })}
              </p>
            )}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Filter className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No activities match the selected filter</p>
            <button 
              onClick={() => setActionFilter('all')}
              className="text-primary text-sm mt-2 hover:underline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Last Login Info */}
            {lastLoginAt && actionFilter === 'all' && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Last Login</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(lastLoginAt, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Badge variant="outline" className="text-primary border-primary/30">
                  {formatDistanceToNowTz(lastLoginAt, { addSuffix: true })}
                </Badge>
              </div>
            )}

            {/* Filtered count indicator */}
            {actionFilter !== 'all' && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredActivities.length} of {activities.length} activities
              </p>
            )}

            {/* Activity Timeline */}
            <div className="relative">
              {filteredActivities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="flex gap-3 pb-4 relative"
                >
                  {/* Timeline line */}
                  {index < filteredActivities.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                  )}
                  
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    activity.success 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {getActionIcon(activity.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm capitalize">
                        {getActionLabel(activity.action)}
                      </p>
                      {activity.success ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </Badge>
                      )}
                      {/* Session Duration Badge */}
                      {activity.sessionDuration !== undefined && activity.sessionDuration > 0 && (
                        <Badge 
                          variant="outline" 
                          className={`gap-1 ${
                            activity.isOngoing 
                              ? 'text-primary border-primary/30 bg-primary/5' 
                              : 'text-muted-foreground border-border'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {formatDuration(activity.sessionDuration)}
                          {activity.isOngoing && ' (ongoing)'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNowTz(activity.created_at, { addSuffix: true })}
                      {' • '}
                      {formatDate(activity.created_at, 'MMM d, h:mm a')}
                    </p>
                    {activity.error_message && (
                      <p className="text-xs text-destructive mt-1 truncate">
                        {activity.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
