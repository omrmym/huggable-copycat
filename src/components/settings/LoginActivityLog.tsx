import { useState } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Shield, Search, RefreshCw, LogIn, LogOut, XCircle, Monitor, Trash2 } from 'lucide-react';
import { formatDate, formatDistanceToNowTz } from '@/lib/dateUtils';
import { useLoginActivity, LoginActivity, useClearLoginActivity } from '@/hooks/useLoginActivity';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useHasPermission } from '@/hooks/useHasPermission';

function getActionBadge(action: LoginActivity['action'], success: boolean) {
  if (!success) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        Failed
      </Badge>
    );
  }

  switch (action) {
    case 'sign_in':
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
          <LogIn className="w-3 h-3" />
          Sign In
        </Badge>
      );
    case 'sign_out':
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
          <LogOut className="w-3 h-3" />
          Sign Out
        </Badge>
      );
    case 'sign_in_failed':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{action}</Badge>;
  }
}

function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';
  
  // Simple browser detection
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Browser';
}

export function LoginActivityLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useHasPermission();
  const canClearLogs = hasPermission('activity.clear_login');
  
  const { data: activities, isLoading, isFetching } = useLoginActivity(100);
  const clearLogs = useClearLoginActivity();

  const filteredActivities = activities?.filter((activity) => {
    const matchesSearch =
      activity.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction =
      actionFilter === 'all' ||
      (actionFilter === 'sign_in' && activity.action === 'sign_in' && activity.success) ||
      (actionFilter === 'sign_out' && activity.action === 'sign_out') ||
      (actionFilter === 'failed' && (!activity.success || activity.action === 'sign_in_failed'));
    
    return matchesSearch && matchesAction;
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['login-activity'] });
  };

  const handleClearLogs = () => {
    clearLogs.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'Logs Cleared',
          description: 'All login activity logs have been deleted.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to clear logs.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Login Activity</CardTitle>
              <CardDescription>
                Track user sign-in and sign-out events for security auditing
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!activities || activities.length === 0 || clearLogs.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Logs
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Login Logs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {activities?.length || 0} login activity records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearLogs}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {clearLogs.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      'Clear All'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
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
              <SelectItem value="sign_in">Sign In</SelectItem>
              <SelectItem value="sign_out">Sign Out</SelectItem>
              <SelectItem value="failed">Failed Attempts</SelectItem>
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
            No login activity found.
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities?.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {activity.user_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.user_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(activity.action, activity.success)}
                      {activity.error_message && (
                        <p className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                          {activity.error_message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {activity.login_method || 'email'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="w-4 h-4" />
                        {parseUserAgent(activity.user_agent)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {formatDistanceToNowTz(activity.created_at, {
                            addSuffix: true,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.created_at, 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Stats Summary */}
        {activities && activities.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {activities.filter((a) => a.action === 'sign_in' && a.success).length}
              </p>
              <p className="text-sm text-muted-foreground">Successful Logins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {activities.filter((a) => a.action === 'sign_out').length}
              </p>
              <p className="text-sm text-muted-foreground">Sign Outs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {activities.filter((a) => !a.success || a.action === 'sign_in_failed').length}
              </p>
              <p className="text-sm text-muted-foreground">Failed Attempts</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
