import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRadiusUsers } from '@/hooks/useRadiusUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Wallet, User, Phone, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RechargeDialog } from '@/components/recharge/RechargeDialog';
import type { Tables } from '@/integrations/supabase/types';

type RadiusUser = Tables<'radius_users'> & {
  plan?: Tables<'billing_plans'> | null;
};

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/20 text-success border-success/30' },
  disabled: { label: 'Disabled', className: 'bg-muted text-muted-foreground border-muted' },
  expired: { label: 'Expired', className: 'bg-warning/20 text-warning border-warning/30' },
  suspended: { label: 'Suspended', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export default function CustomerRecharge() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<RadiusUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data: users = [], isLoading } = useRadiusUsers();

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const handleSelectUser = (user: RadiusUser) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  return (
    <DashboardLayout title="Customer Recharge" subtitle="Add balance to customer accounts">
      {/* Search Section */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Find Customer
          </CardTitle>
          <CardDescription>
            Search by User ID, Name, or Mobile Number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by User ID, Name, or Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>
            {searchQuery ? `Search Results (${filteredUsers.length})` : `All Customers (${users.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No customers found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term.' : 'No customers registered yet.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-center">Grace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const status = statusConfig[user.status] || statusConfig.active;
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <button
                                onClick={() => navigate(`/users/${user.id}`)}
                                className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer text-left"
                              >
                                {user.full_name || user.username}
                              </button>
                              <button
                                onClick={() => navigate(`/users/${user.id}`)}
                                className="text-sm text-primary hover:underline cursor-pointer block"
                              >
                                @{user.username}
                              </button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {user.phone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{user.plan?.name || 'No Plan'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-foreground">
                              ৳{(user.balance || 0).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.grace_days_used > 0 ? (
                            <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                              {user.grace_days_used}d
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('capitalize', status.className)}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="bg-gradient-primary text-primary-foreground"
                            onClick={() => handleSelectUser(user)}
                          >
                            <Wallet className="w-4 h-4 mr-1" />
                            Recharge
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recharge Dialog */}
      {selectedUser && (
        <RechargeDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          user={selectedUser}
        />
      )}
    </DashboardLayout>
  );
}