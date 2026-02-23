import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Search, Filter, CreditCard, Clock, CalendarIcon, X, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function ResellerPendingBillCollection() {
  const { reseller, isLoading } = useResellerAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);

  const isSuperAdmin = reseller?.is_super_admin || false;

  useEffect(() => {
    if (!isLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, isLoading, navigate]);

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['reseller-pending-transactions', reseller?.id, isSuperAdmin],
    queryFn: async () => {
      let query = supabase
        .from('reseller_user_recharges')
        .select('*, radius_users(username, full_name, phone), billing_plans(name), resellers(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!isSuperAdmin && reseller?.id) {
        query = query.eq('reseller_id', reseller.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!reseller?.id || isSuperAdmin,
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        tx.radius_users?.username?.toLowerCase().includes(query) ||
        tx.radius_users?.full_name?.toLowerCase().includes(query);

      let matchesDate = true;
      if (startDate || endDate) {
        const txDate = parseISO(tx.created_at);
        if (startDate && endDate) {
          matchesDate = isWithinInterval(txDate, {
            start: startOfDay(startDate),
            end: endOfDay(endDate),
          });
        } else if (startDate) {
          matchesDate = txDate >= startOfDay(startDate);
        } else if (endDate) {
          matchesDate = txDate <= endOfDay(endDate);
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [transactions, searchQuery, startDate, endDate]);

  const stats = useMemo(() => {
    const total = filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    return { total, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredTransactions.map((tx) => tx.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleApprove = async (txId: string) => {
    setApproving(true);
    try {
      const { error } = await supabase
        .from('reseller_user_recharges')
        .update({ status: 'completed' })
        .eq('id', txId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['reseller-pending-transactions'] });
      toast.success('Transaction approved');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setApproving(false);
    }
  };

  const handleBulkApprove = async () => {
    setApproving(true);
    try {
      const { error } = await supabase
        .from('reseller_user_recharges')
        .update({ status: 'completed' })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['reseller-pending-transactions'] });
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} transactions approved`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setApproving(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = searchQuery || startDate || endDate;
  const isAllSelected = filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length;

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
      title={isSuperAdmin ? "All Pending Bill Collection" : "Pending Bill Collection"} 
      subtitle="Review and approve pending transactions"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pending Amount
            </CardDescription>
            <CardTitle className="text-2xl text-warning">
              {txLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `৳${stats.total.toLocaleString()}`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Transactions
            </CardDescription>
            <CardTitle className="text-2xl">
              {txLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.count}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Customer name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-secondary border-border',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-secondary border-border',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {hasActiveFilters && (
              <Button variant="outline" className="border-border" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
            {selectedIds.size > 0 && (
              <Button
                className="bg-success text-success-foreground ml-auto"
                onClick={handleBulkApprove}
                disabled={approving}
              >
                {approving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Selected ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Pending Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No pending transactions</h3>
              <p className="text-muted-foreground">All transactions have been processed.</p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    {isSuperAdmin && <TableHead>Reseller</TableHead>}
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const isSelected = selectedIds.has(tx.id);
                    return (
                      <TableRow key={tx.id} className={cn('hover:bg-muted/30', isSelected && 'bg-primary/5')}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(tx.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(tx.created_at), 'MMM dd, yyyy')}
                          <br />
                          <span className="text-xs">{format(parseISO(tx.created_at), 'hh:mm a')}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tx.radius_users?.full_name || '-'}</p>
                            <p className="text-sm text-muted-foreground font-mono">
                              @{tx.radius_users?.username}
                            </p>
                          </div>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <span className="text-primary">{tx.resellers?.name || '-'}</span>
                          </TableCell>
                        )}
                        <TableCell>{tx.billing_plans?.name || '-'}</TableCell>
                        <TableCell className="text-right font-medium">৳{tx.amount}</TableCell>
                        <TableCell className="text-right text-success">
                          ৳{tx.commission_amount} ({tx.commission_rate}%)
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleApprove(tx.id)}
                            disabled={approving}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
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
    </ResellerLayout>
  );
}
