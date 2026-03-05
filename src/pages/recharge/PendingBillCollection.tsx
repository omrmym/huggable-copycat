import { useState, useMemo } from 'react';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useNavigate } from 'react-router-dom';
import { sendSms } from '@/hooks/useSendSms';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePendingTransactions, useApproveTransaction } from '@/hooks/useTransactions';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useSoftwareUsers } from '@/hooks/useSoftwareUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Clock,
  Calendar as CalendarIcon,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  X,
  Loader2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'> & {
  radius_user?: {
    id: string;
    username: string;
    full_name: string | null;
    phone: string | null;
  } | null;
  collected_by?: string | null;
  payment_method?: string | null;
};

const typeConfig: Record<string, { label: string; className: string }> = {
  recharge: { label: 'Recharge', className: 'bg-success/20 text-success border-success/30' },
  payment: { label: 'Payment', className: 'bg-primary/20 text-primary border-primary/30' },
  renewal: { label: 'Renewal', className: 'bg-info/20 text-info border-info/30' },
  voucher_activation: { label: 'Voucher', className: 'bg-warning/20 text-warning border-warning/30' },
  refund: { label: 'Refund', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export default function PendingBillCollection() {
  const { hasPermission } = useHasPermission();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [collectedByFilter, setCollectedByFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: transactions = [], isLoading } = usePendingTransactions();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: softwareUsers = [] } = useSoftwareUsers();
  const approveTransaction = useApproveTransaction();
  const navigate = useNavigate();
  

  // Get unique collectors from transactions
  const uniqueCollectors = useMemo(() => {
    const collectors = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.collected_by) {
        collectors.add(tx.collected_by);
      }
    });
    return Array.from(collectors).sort();
  }, [transactions]);

  // Get unique payment methods from transactions
  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.payment_method) {
        methods.add(tx.payment_method);
      }
    });
    return Array.from(methods).sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        tx.radius_user?.username?.toLowerCase().includes(query) ||
        tx.radius_user?.full_name?.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query);

      
      const matchesCollectedBy = collectedByFilter === 'all' || tx.collected_by === collectedByFilter;
      const matchesPaymentMethod = paymentMethodFilter === 'all' || tx.payment_method === paymentMethodFilter;

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

      return matchesSearch && matchesDate && matchesCollectedBy && matchesPaymentMethod;
    });
  }, [transactions, searchQuery, collectedByFilter, paymentMethodFilter, startDate, endDate]);

  // Calculate stats from filtered transactions
  const stats = useMemo(() => {
    const total = filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const count = filteredTransactions.length;
    return { total, count };
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

  const handleApprove = async (tx: Transaction) => {
    if (!tx.radius_user_id) return;
    await approveTransaction.mutateAsync({
      transactionId: tx.id,
    });

    // Send payment confirmation SMS after approval
    if (tx.radius_user?.phone) {
      const smsMessage = `Payment of ৳${Number(tx.amount).toLocaleString()} approved. Thank you!`;
      sendSms({
        phone: tx.radius_user.phone,
        message: smsMessage,
        automationType: 'payment_confirmation',
        recipientName: tx.radius_user.full_name || tx.radius_user.username,
        radiusUserId: tx.radius_user.id,
      }).catch(() => {});
    }
  };

  const handleBulkApprove = async () => {
    const selectedTxs = filteredTransactions.filter((tx) => selectedIds.has(tx.id) && tx.radius_user_id);
    for (const tx of selectedTxs) {
      await approveTransaction.mutateAsync({
        transactionId: tx.id,
      });
    }
    setSelectedIds(new Set());
  };


  const clearFilters = () => {
    setSearchQuery('');
    setCollectedByFilter('all');
    setPaymentMethodFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = searchQuery || collectedByFilter !== 'all' || paymentMethodFilter !== 'all' || startDate || endDate;
  const isAllSelected = filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length;
  const isSomeSelected = selectedIds.size > 0;

  return (
    <DashboardLayout title="Pending Bill Collection" subtitle="Review and approve pending transactions">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pending Amount
            </CardDescription>
            <CardTitle className="text-2xl text-warning">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `৳${stats.total.toLocaleString()}`}
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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


            <div className="space-y-2">
              <Label>Collected By</Label>
              <Select value={collectedByFilter} onValueChange={setCollectedByFilter}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All Collectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collectors</SelectItem>
                  {uniqueCollectors.map((collector) => (
                    <SelectItem key={collector} value={collector}>
                      {collector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {uniquePaymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {isSomeSelected && hasPermission('recharge.pending.approve') && (
              <Button
                className="bg-success text-success-foreground ml-auto"
                onClick={handleBulkApprove}
                disabled={approveTransaction.isPending}
              >
                {approveTransaction.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No pending transactions</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters.'
                  : 'All transactions have been processed.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Collected By</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const typeInfo = typeConfig[tx.type] || typeConfig.payment;
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
                        <TableCell>
                          <Badge variant="outline" className={cn('capitalize', typeInfo.className)}>
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {tx.collected_by || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {tx.payment_method || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[150px] truncate">
                          {tx.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-warning">
                            ৳{Number(tx.amount).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {hasPermission('recharge.pending.approve') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-success text-success hover:bg-success hover:text-success-foreground"
                              onClick={() => handleApprove(tx)}
                              disabled={approveTransaction.isPending || !tx.radius_user_id}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
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
