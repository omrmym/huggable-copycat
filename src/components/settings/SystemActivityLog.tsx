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
import { Loader2, Activity, Search, RefreshCw, Trash2, Plus, Edit, Trash, DollarSign, UserCheck } from 'lucide-react';
import { formatDate, formatDistanceToNowTz } from '@/lib/dateUtils';
import { useSystemActivity, useClearSystemActivity, getActionLabel, getEntityLabel } from '@/hooks/useSystemActivity';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useHasPermission } from '@/hooks/useHasPermission';

function getActionBadge(action: string) {
  switch (action) {
    case 'create':
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
          <Plus className="w-3 h-3" />
          {getActionLabel(action)}
        </Badge>
      );
    case 'update':
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
          <Edit className="w-3 h-3" />
          {getActionLabel(action)}
        </Badge>
      );
    case 'delete':
      return (
        <Badge variant="destructive" className="gap-1">
          <Trash className="w-3 h-3" />
          {getActionLabel(action)}
        </Badge>
      );
    case 'recharge':
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
          <DollarSign className="w-3 h-3" />
          {getActionLabel(action)}
        </Badge>
      );
    case 'status_change':
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 gap-1">
          <UserCheck className="w-3 h-3" />
          {getActionLabel(action)}
        </Badge>
      );
    default:
      return <Badge variant="outline">{getActionLabel(action)}</Badge>;
  }
}

function getEntityBadge(entityType: string) {
  const colors: Record<string, string> = {
    software_user: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    radius_user: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    billing_plan: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    reseller: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    transaction: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    expense: 'bg-red-500/20 text-red-400 border-red-500/30',
    income: 'bg-green-500/20 text-green-400 border-green-500/30',
    settings: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <Badge variant="outline" className={colors[entityType] || ''}>
      {getEntityLabel(entityType)}
    </Badge>
  );
}

export function SystemActivityLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useHasPermission();
  const canClearLogs = hasPermission('activity.clear_system');
  
  const { data: activities, isLoading, isFetching } = useSystemActivity(200);
  const clearLogs = useClearSystemActivity();

  const filteredActivities = activities?.filter((activity) => {
    const matchesSearch =
      activity.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || activity.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || activity.entity_type === entityFilter;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['system-activity'] });
  };

  const handleClearLogs = () => {
    clearLogs.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'Logs Cleared',
          description: 'All system activity logs have been deleted.',
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

  // Get unique entity types from data for filter
  const entityTypes = [...new Set(activities?.map(a => a.entity_type) || [])];
  const actionTypes = [...new Set(activities?.map(a => a.action) || [])];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>
                Track all changes made across the software
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
                  <AlertDialogTitle>Clear All Activity Logs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {activities?.length || 0} activity records. This action cannot be undone.
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
              placeholder="Search by user or entity name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map(action => (
                <SelectItem key={action} value={action}>
                  {getActionLabel(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes.map(entity => (
                <SelectItem key={entity} value={entity}>
                  {getEntityLabel(entity)}
                </SelectItem>
              ))}
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
            No system activity found.
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Target</TableHead>
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
                      {getActionBadge(activity.action)}
                    </TableCell>
                    <TableCell>
                      {getEntityBadge(activity.entity_type)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {activity.entity_name || '-'}
                      </p>
                      {activity.entity_id && (
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {activity.entity_id}
                        </p>
                      )}
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
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {activities.filter((a) => a.action === 'create').length}
              </p>
              <p className="text-sm text-muted-foreground">Created</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {activities.filter((a) => a.action === 'update').length}
              </p>
              <p className="text-sm text-muted-foreground">Updated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {activities.filter((a) => a.action === 'delete').length}
              </p>
              <p className="text-sm text-muted-foreground">Deleted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">
                {activities.filter((a) => a.action === 'recharge').length}
              </p>
              <p className="text-sm text-muted-foreground">Recharges</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
