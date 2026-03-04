import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Search, Wallet, User, Phone, CreditCard } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ResellerRechargeDialog } from '@/components/reseller/ResellerRechargeDialog';

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/20 text-success border-success/30' },
  disabled: { label: 'Disabled', className: 'bg-muted text-muted-foreground border-muted' },
  expired: { label: 'Expired', className: 'bg-warning/20 text-warning border-warning/30' },
  suspended: { label: 'Suspended', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export default function ResellerCustomerRecharge() {
  const { reseller, isLoading } = useResellerAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);

  const isSuperAdmin = reseller?.is_super_admin || false;

  useEffect(() => {
    if (!isLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, isLoading, navigate]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['reseller-users-for-recharge', reseller?.id, isSuperAdmin],
    queryFn: async () => {
      const sessionToken = localStorage.getItem('reseller_session_token');
      const { data, error } = await supabase.functions.invoke('reseller-get-recharge-users', {
        body: {
          resellerId: reseller?.id,
          isSuperAdmin,
          session_token: sessionToken,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch users');
      return data.data || [];
    },
    enabled: !!reseller?.id || isSuperAdmin,
  });

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const handleRechargeClick = (user: any) => {
    setSelectedUser(user);
    setRechargeDialogOpen(true);
  };

  const handleDialogClose = () => {
    setRechargeDialogOpen(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reseller) return null;

  return (
    <ResellerLayout 
      title={isSuperAdmin ? "All Customer Recharge" : "Customer Recharge"} 
      subtitle="Add balance to customer accounts"
    >
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
          {usersLoading ? (
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
                    {isSuperAdmin && <TableHead>Reseller</TableHead>}
                    <TableHead>Phone</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-center">Grace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const status = statusConfig[user.status as keyof typeof statusConfig] || statusConfig.active;
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <button
                                onClick={() => navigate(`/reseller/users/${user.id}`)}
                                className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer text-left"
                              >
                                {user.full_name || user.username}
                              </button>
                              <button
                                onClick={() => navigate(`/reseller/users/${user.id}`)}
                                className="text-sm text-primary hover:underline cursor-pointer block"
                              >
                                @{user.username}
                              </button>
                            </div>
                          </div>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <span className="text-sm text-primary">
                              {(user as any).resellers?.name || '-'}
                            </span>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {user.phone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{user.plan?.name || 'No Plan'}</span>
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
                            onClick={() => handleRechargeClick(user)}
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
        <ResellerRechargeDialog
          open={rechargeDialogOpen}
          onOpenChange={handleDialogClose}
          user={selectedUser}
          resellerId={reseller.id}
        />
      )}
    </ResellerLayout>
  );
}
