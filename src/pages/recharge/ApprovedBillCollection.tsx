import { useState, useMemo } from 'react';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompletedTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Search,
  CheckCircle,
  Calendar as CalendarIcon,
  CreditCard,
  Filter,
  X,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const typeConfig: Record<string, { label: string; className: string }> = {
  recharge: { label: 'Recharge', className: 'bg-success/20 text-success border-success/30' },
  payment: { label: 'Payment', className: 'bg-primary/20 text-primary border-primary/30' },
  renewal: { label: 'Renewal', className: 'bg-info/20 text-info border-info/30' },
  voucher_activation: { label: 'Voucher', className: 'bg-warning/20 text-warning border-warning/30' },
  refund: { label: 'Refund', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export default function ApprovedBillCollection() {
  const { hasPermission } = useHasPermission();
  const [searchQuery, setSearchQuery] = useState('');
  const [collectedByFilter, setCollectedByFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const queryClient = useQueryClient();
  const { data: transactions = [], isLoading } = useCompletedTransactions();
  const navigate = useNavigate();

  // Get unique collectors and payment methods for filters
  const collectors = useMemo(() => {
    const unique = new Set(transactions.map(tx => tx.collected_by).filter(Boolean));
    return Array.from(unique) as string[];
  }, [transactions]);

  const paymentMethods = useMemo(() => {
    const unique = new Set(transactions.map(tx => tx.payment_method).filter(Boolean));
    return Array.from(unique) as string[];
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search filter
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        tx.radius_user?.username?.toLowerCase().includes(query) ||
        tx.radius_user?.full_name?.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query);

      // Collected By filter
      const matchesCollectedBy = collectedByFilter === 'all' || tx.collected_by === collectedByFilter;

      // Method filter
      const matchesMethod = methodFilter === 'all' || tx.payment_method === methodFilter;

      // Date range filter
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

      return matchesSearch && matchesCollectedBy && matchesMethod && matchesDate;
    });
  }, [transactions, searchQuery, collectedByFilter, methodFilter, startDate, endDate]);

  // Calculate stats from filtered transactions
  const stats = useMemo(() => {
    const total = filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const count = filteredTransactions.length;
    return { total, count };
  }, [filteredTransactions]);

  // Reject transaction (move back to pending)
  const handleReject = async (transactionId: string) => {
    setRejectingId(transactionId);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'pending' })
        .eq('id', transactionId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction moved back to pending');
    } catch (error: any) {
      toast.error(`Failed to reject transaction: ${error.message}`);
    } finally {
      setRejectingId(null);
    }
  };

  // Delete transaction permanently
  const handleDelete = async (transactionId: string) => {
    setDeletingId(transactionId);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction deleted successfully');
    } catch (error: any) {
      toast.error(`Failed to delete transaction: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCollectedByFilter('all');
    setMethodFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = searchQuery || collectedByFilter !== 'all' || methodFilter !== 'all' || startDate || endDate;

  return (
    <DashboardLayout title="Approved Bill Collection" subtitle="View completed payment transactions">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Total Collected
            </CardDescription>
            <CardTitle className="text-2xl text-success">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `৳${stats.total.toLocaleString()}`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Transactions
            </CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? <Skeleton className="h-8 w-16" /> : stats.count.toLocaleString()}
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Customer or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>

            {/* Collected By Filter */}
            <div className="space-y-2">
              <Label>Collected By</Label>
              <Select value={collectedByFilter} onValueChange={setCollectedByFilter}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All Collectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collectors</SelectItem>
                  {collectors.map((collector) => (
                    <SelectItem key={collector} value={collector}>
                      {collector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Method Filter */}
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
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

            {/* End Date */}
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

          {/* Action Buttons */}
          {hasActiveFilters && (
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="border-border" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Approved Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters.'
                  : 'No completed transactions yet.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Collected By</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    return (
                      <TableRow key={tx.id} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(tx.created_at), 'MMM dd, yyyy')}
                          <br />
                          <span className="text-xs">{format(parseISO(tx.created_at), 'hh:mm a')}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <button
                              onClick={() => tx.radius_user?.id && navigate(`/users/${tx.radius_user.id}`)}
                              className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer text-left"
                            >
                              {tx.radius_user?.full_name || tx.radius_user?.username || 'Unknown'}
                            </button>
                            <button
                              onClick={() => tx.radius_user?.id && navigate(`/users/${tx.radius_user.id}`)}
                              className="text-sm text-primary hover:underline cursor-pointer block"
                            >
                              @{tx.radius_user?.username || 'N/A'}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.collected_by || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.payment_method || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-success">
                            ৳{Number(tx.amount).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {hasPermission('recharge.approved.delete') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-warning/30 text-warning hover:bg-warning/10"
                                onClick={() => handleReject(tx.id)}
                                disabled={rejectingId === tx.id}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                {rejectingId === tx.id ? 'Moving...' : 'Reject'}
                              </Button>
                            )}
                            {hasPermission('recharge.approved.delete_transaction') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(tx.id)}
                                disabled={deletingId === tx.id}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                {deletingId === tx.id ? 'Deleting...' : 'Delete'}
                              </Button>
                            )}
                          </div>
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
    </DashboardLayout>
  );
}
