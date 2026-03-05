import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Users, Search, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { formatDate, formatDistanceToNowTz } from '@/lib/dateUtils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface GlobalUserActivity {
  id: string;
  action: string;
  success: boolean | null;
  error_message: string | null;
  created_at: string;
  radius_user_id: string | null;
  radius_user?: {
    username: string;
    full_name: string | null;
  } | null;
}

function useGlobalUserActivity(limit = 200) {
  return useQuery({
    queryKey: ['global-user-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mikrotik_sync_log')
        .select('id, action, success, error_message, created_at, radius_user_id')
        .in('action', ['connect', 'disconnect'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch user details for all unique radius_user_ids
      const userIds = [...new Set((data || []).map(d => d.radius_user_id).filter(Boolean))] as string[];
      let userMap: Record<string, { username: string; full_name: string | null }> = {};

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('radius_users')
          .select('id, username, full_name')
          .in('id', userIds);

        if (users) {
          userMap = users.reduce((acc, u) => {
            acc[u.id] = { username: u.username, full_name: u.full_name };
            return acc;
          }, {} as Record<string, { username: string; full_name: string | null }>);
        }
      }

      return (data || []).map(item => ({
        ...item,
        radius_user: item.radius_user_id ? userMap[item.radius_user_id] || null : null,
      })) as GlobalUserActivity[];
    },
  });
}

export function UserActivityLogGlobal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: activities, isLoading, isFetching } = useGlobalUserActivity(200);

  const filteredActivities = useMemo(() => {
    return activities?.filter((activity) => {
      const matchesSearch =
        activity.radius_user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.radius_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === 'all' || activity.action === actionFilter;

      return (searchTerm === '' || matchesSearch) && matchesAction;
    });
  }, [activities, searchTerm, actionFilter]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['global-user-activity'] });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>
                Track user connection and disconnection events
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="connect">Connected</SelectItem>
              <SelectItem value="disconnect">Disconnected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredActivities?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No user activity found.
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities?.map((activity) => {
                  const isConnect = activity.action === 'connect';
                  return (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {activity.radius_user?.username || 'Unknown'}
                          </p>
                          {activity.radius_user?.full_name && (
                            <p className="text-sm text-muted-foreground">
                              {activity.radius_user.full_name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${
                          isConnect
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}>
                          {isConnect ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {isConnect ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activity.success ? (
                          <Badge variant="outline" className="text-green-500 border-green-500/30">
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                        {activity.error_message && (
                          <p className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                            {activity.error_message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {formatDistanceToNowTz(activity.created_at, { addSuffix: true })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(activity.created_at, 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Stats Summary */}
        {activities && activities.length > 0 && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {activities.filter((a) => a.action === 'connect').length}
              </p>
              <p className="text-sm text-muted-foreground">Connections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {activities.filter((a) => a.action === 'disconnect').length}
              </p>
              <p className="text-sm text-muted-foreground">Disconnections</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
