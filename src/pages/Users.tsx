import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserStatusBadge } from '@/components/dashboard/UserStatusBadge';
import { useRadiusUsers, useDeleteRadiusUser, useUpdateRadiusUser, useBulkDeleteRadiusUsers, useBulkTransferRouter } from '@/hooks/useRadiusUsers';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Download,
  Wifi,
  Network,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  Loader2,
  Settings2,
  Calendar,
  ArrowRightLeft,
} from 'lucide-react';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { RechargeDialog } from '@/components/recharge/RechargeDialog';
import { BulkTransferRouterDialog } from '@/components/users/BulkTransferRouterDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { writeExcelFile } from '@/lib/excelUtils';
import type { Tables } from '@/integrations/supabase/types';
import { useHasPermission } from '@/hooks/useHasPermission';

type RadiusUser = Tables<'radius_users'> & {
  plan?: Tables<'billing_plans'> | null;
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  
  const [billingFilter, setBillingFilter] = useState<string>('all'); // free, paid, all
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RadiusUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
  const [expireDateDialogOpen, setExpireDateDialogOpen] = useState(false);
  const [expireDateUser, setExpireDateUser] = useState<{ id: string; username: string; expires_at: string | null } | null>(null);
  const [newExpireDate, setNewExpireDate] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusUser, setStatusUser] = useState<{ id: string; username: string; status: string } | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const { data: users = [], isLoading: usersLoading } = useRadiusUsers();
  const { data: plans = [] } = useBillingPlans();
  const deleteUser = useDeleteRadiusUser();
  const updateUser = useUpdateRadiusUser();
  const bulkDeleteUsers = useBulkDeleteRadiusUsers();
  const bulkTransferRouter = useBulkTransferRouter();
  const { hasPermission } = useHasPermission();

  // Initialize filters from URL params
  useEffect(() => {
    const status = searchParams.get('status');
    const billing = searchParams.get('billing');
    
    if (status) {
      setStatusFilter(status);
    }
    if (billing) {
      setBillingFilter(billing);
    }
  }, [searchParams]);

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (user.full_name?.toLowerCase() || '').includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower) ||
      (user.phone?.toLowerCase() || '').includes(searchLower);

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesService = serviceFilter === 'all' || user.service_type === serviceFilter;
    
    
    // Billing filter: free (monthly_bill = 0)
    let matchesBilling = true;
    if (billingFilter === 'free') {
      matchesBilling = (user.monthly_bill || 0) === 0;
    } else if (billingFilter === 'paid') {
      matchesBilling = true; // No balance tracking
    } else if (billingFilter === 'auto_renew') {
      matchesBilling = user.auto_renew === true;
    }

    return matchesSearch && matchesStatus && matchesService && matchesBilling;
  });

  const getPlanName = (planId: string | null) => {
    if (!planId) return 'No plan';
    const plan = plans.find((p) => p.id === planId);
    return plan?.name || 'Unknown';
  };

  const formatDataUsage = (used: number, limit: number | null) => {
    const usedGB = (used / 1024).toFixed(1);
    if (limit === null) return `${usedGB} GB (Unlimited)`;
    const limitGB = (limit / 1024).toFixed(1);
    const percentage = Math.round((used / limit) * 100);
    return `${usedGB} / ${limitGB} GB (${percentage}%)`;
  };

  const handleSuspendUser = async (user: typeof users[0]) => {
    await updateUser.mutateAsync({
      id: user.id,
      status: user.status === 'suspended' ? 'active' : 'suspended',
    });
  };

  const handleStatusClick = (user: typeof users[0]) => {
    setStatusUser({ id: user.id, username: user.username, status: user.status });
    setNewStatus(user.status);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!statusUser || !newStatus) return;
    
    await updateUser.mutateAsync({
      id: statusUser.id,
      status: newStatus as 'active' | 'disabled' | 'expired' | 'suspended',
    });
    setStatusDialogOpen(false);
    setStatusUser(null);
    setNewStatus('');
  };

  const handleDeleteUser = async (user: typeof users[0]) => {
    if (confirm(`Are you sure you want to delete ${user.username}?`)) {
      await deleteUser.mutateAsync({
        id: user.id,
        username: user.username,
        service_type: user.service_type,
      });
    }
  };

  const handleRechargeClick = (user: typeof users[0]) => {
    setSelectedUser(user as RadiusUser);
    setRechargeDialogOpen(true);
  };

  const handleEditClick = (user: typeof users[0]) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleExpireDateClick = (user: typeof users[0]) => {
    setExpireDateUser({ id: user.id, username: user.username, expires_at: user.expires_at });
    setNewExpireDate(user.expires_at ? new Date(user.expires_at).toISOString().slice(0, 16) : '');
    setExpireDateDialogOpen(true);
  };

  const handleExpireDateChange = async () => {
    if (!expireDateUser || !newExpireDate) return;
    
    const expireDate = new Date(newExpireDate);
    
    const now = new Date();
    const isBackdated = expireDate <= now;
    const isFuture = expireDate > now;
    
    await updateUser.mutateAsync({
      id: expireDateUser.id,
      expires_at: expireDate.toISOString(),
      // If backdated, immediately set status to expired; if future, set to active
      ...(isBackdated && {
        status: 'expired',
        mikrotik_synced: false,
      }),
      ...(isFuture && {
        status: 'active',
        mikrotik_synced: false,
      }),
    });
    setExpireDateDialogOpen(false);
    setExpireDateUser(null);
    setNewExpireDate('');
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    const usersToDelete = users.filter(u => selectedUserIds.has(u.id)).map(u => ({
      id: u.id,
      username: u.username,
      service_type: u.service_type,
    }));
    await bulkDeleteUsers.mutateAsync(usersToDelete);
    setSelectedUserIds(new Set());
    setBulkDeleteDialogOpen(false);
  };

  const handleBulkTransfer = async (targetRouterId: string) => {
    const usersToTransfer = users.filter(u => selectedUserIds.has(u.id)).map(u => ({
      id: u.id,
      username: u.username,
      service_type: u.service_type,
      mikrotik_router_id: u.mikrotik_router_id,
    }));
    await bulkTransferRouter.mutateAsync({ users: usersToTransfer, targetRouterId });
    setSelectedUserIds(new Set());
    setTransferDialogOpen(false);
  };

  const selectedUsersRouterIds = users
    .filter(u => selectedUserIds.has(u.id))
    .map(u => u.mikrotik_router_id || '');

  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.has(u.id));

  const handleExport = async () => {
    if (filteredUsers.length === 0) {
      toast.error('No users to export');
      return;
    }

    const exportData = filteredUsers.map((user) => ({
      'User ID': user.username,
      'Full Name': user.full_name || '',
      'Phone': user.phone || '',
      'Email': user.email || '',
      'Service Type': user.service_type?.toUpperCase() || '',
      'Connectivity': user.connectivity_type || '',
      'Plan': getPlanName(user.plan_id),
      'Monthly Bill': user.monthly_bill || 0,
      
      
      'Status': user.status,
      'Expires At': user.expires_at ? new Date(user.expires_at).toLocaleDateString() : '',
      'Grace Days Used': user.grace_days_used || 0,
      'Connection Date': user.connection_date ? new Date(user.connection_date).toLocaleDateString() : '',
      'Address': user.address_details || '',
    }));

    const fileName = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    await writeExcelFile(exportData, fileName, 'Users');
    
    toast.success(`Exported ${filteredUsers.length} users`);
  };

  return (
    <DashboardLayout title="All User" subtitle="Manage Hotspot users">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by User ID, Name, or Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-card border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-border" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Results count and bulk actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
          {selectedUserIds.size > 0 && (
            <span className="ml-2 text-primary">({selectedUserIds.size} selected)</span>
          )}
        </p>
        {selectedUserIds.size > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferDialogOpen(true)}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transfer Router ({selectedUserIds.size})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedUserIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                    aria-label="Select all"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User ID
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Service
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Connectivity
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Monthly Bill
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Usage
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expires
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Grace
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-10 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-8" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`data-table-row ${selectedUserIds.has(user.id) ? 'bg-muted/50' : ''}`}>
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedUserIds.has(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked === true)}
                        aria-label={`Select ${user.username}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/users/${user.id}`)}
                        className="text-sm font-mono text-primary hover:underline cursor-pointer"
                      >
                        {user.username}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <button
                          onClick={() => navigate(`/users/${user.id}`)}
                          className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer"
                        >
                          {user.full_name || '-'}
                        </button>
                        {user.email && (
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.service_type === 'hotspot' ? (
                          <Wifi className="w-4 h-4 text-primary" />
                        ) : (
                          <Network className="w-4 h-4 text-primary" />
                        )}
                        <span className="text-sm capitalize">{user.service_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {user.connectivity_type || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{getPlanName(user.plan_id)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {(user.monthly_bill || 0) === 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          Free
                        </span>
                      ) : (
                        <span className="text-sm font-mono">
                          ৳{user.monthly_bill?.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-mono">
                          {formatDataUsage(user.data_used_mb, user.plan?.data_limit_mb ?? null)}
                        </span>
                        {user.plan?.data_limit_mb && (
                          <div className="w-24 h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.min(
                                  (user.data_used_mb / user.plan.data_limit_mb) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {user.expires_at
                          ? new Date(user.expires_at).toLocaleDateString()
                          : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.grace_days_used > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
                          {user.grace_days_used}d
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {hasPermission('users.all.edit') && (
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                          )}
                          {hasPermission('users.all.recharge') && (
                            <DropdownMenuItem
                              className="text-primary"
                              onClick={() => handleRechargeClick(user)}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Recharge
                            </DropdownMenuItem>
                          )}
                          {hasPermission('users.all.change_expire') && (
                            <DropdownMenuItem onClick={() => handleExpireDateClick(user)}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Change Expire
                            </DropdownMenuItem>
                          )}
                          {hasPermission('users.all.change_status') && (
                            <DropdownMenuItem onClick={() => handleStatusClick(user)}>
                              <Settings2 className="w-4 h-4 mr-2" />
                              Change Status
                            </DropdownMenuItem>
                          )}
                          {hasPermission('users.all.delete') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recharge Dialog - Using shared component */}
      <RechargeDialog
        user={selectedUser}
        open={rechargeDialogOpen}
        onOpenChange={setRechargeDialogOpen}
      />

      {/* Change Expire Date Dialog */}
      <Dialog open={expireDateDialogOpen} onOpenChange={setExpireDateDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Change Expire Date</DialogTitle>
            <DialogDescription>
              Update expiration date for {expireDateUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Expire Date</Label>
              <p className="text-sm text-muted-foreground">
                {expireDateUser?.expires_at
                  ? new Date(expireDateUser.expires_at).toLocaleString()
                  : 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newExpireDate">New Expire Date</Label>
              <Input
                id="newExpireDate"
                type="datetime-local"
                value={newExpireDate}
                onChange={(e) => setNewExpireDate(e.target.value)}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                Time will be set to 09:00 AM automatically
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="border-border" onClick={() => setExpireDateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={handleExpireDateChange}
              disabled={updateUser.isPending || !newExpireDate}
            >
              {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Change User Status</DialogTitle>
            <DialogDescription>
              Update status for {statusUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <p className="text-sm capitalize text-muted-foreground">
                {statusUser?.status}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newStatus">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="border-border" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={handleStatusChange}
              disabled={updateUser.isPending || !newStatus || newStatus === statusUser?.status}
            >
              {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedUserIds.size} Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUserIds.size} selected user(s)? 
              This action cannot be undone and will also remove them from MikroTik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteUsers.isPending}
            >
              {bulkDeleteUsers.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete {selectedUserIds.size} Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Transfer Router Dialog */}
      <BulkTransferRouterDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        selectedCount={selectedUserIds.size}
        currentRouterIds={selectedUsersRouterIds}
        onTransfer={handleBulkTransfer}
        isTransferring={bulkTransferRouter.isPending}
      />
    </DashboardLayout>
  );
}