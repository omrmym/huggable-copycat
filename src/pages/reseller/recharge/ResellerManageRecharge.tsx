import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Search, Filter, CreditCard, CalendarIcon, X, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoicePreviewDialog } from '@/components/invoice/InvoicePreviewDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ResellerManageRecharge() {
  const { reseller, isLoading } = useResellerAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collectByFilter, setCollectByFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);

  const isSuperAdmin = reseller?.is_super_admin || false;

  useEffect(() => {
    if (!isLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, isLoading, navigate]);

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['reseller-all-transactions', reseller?.id, isSuperAdmin],
    queryFn: async () => {
      const sessionToken = localStorage.getItem('reseller_session_token');
      const { data, error } = await supabase.functions.invoke('reseller-get-transactions', {
        body: { resellerId: reseller?.id, isSuperAdmin, session_token: sessionToken },
      });
      if (error || !data?.success) throw new Error(data?.error || 'Failed to fetch transactions');
      return data.data || [];
    },
    enabled: !!reseller?.id || isSuperAdmin,
  });

  // Get unique reseller names for Collect By filter
  const resellerNames = useMemo(() => {
    const names = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.resellers?.name) names.add(tx.resellers.name);
    });
    return Array.from(names).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        tx.radius_users?.username?.toLowerCase().includes(query) ||
        tx.radius_users?.full_name?.toLowerCase().includes(query) ||
        tx.radius_users?.phone?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

      const collectBy = tx.resellers?.name || 'Unknown';
      const matchesCollectBy = collectByFilter === 'all' || collectBy === collectByFilter;

      let matchesDate = true;
      if (dateRange?.from || dateRange?.to) {
        const txDate = parseISO(tx.created_at);
        if (dateRange.from && dateRange.to) {
          matchesDate = isWithinInterval(txDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          });
        } else if (dateRange.from) {
          matchesDate = txDate >= startOfDay(dateRange.from);
        } else if (dateRange.to) {
          matchesDate = txDate <= endOfDay(dateRange.to);
        }
      }

      return matchesSearch && matchesStatus && matchesCollectBy && matchesDate;
    });
  }, [transactions, searchQuery, statusFilter, collectByFilter, dateRange]);

  const stats = useMemo(() => {
    const completedTx = filteredTransactions.filter(tx => tx.status === 'completed');
    const total = completedTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
    return { total, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleRowClick = (tx: any) => {
    setSelectedInvoice(tx);
    setInvoicePreviewOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, tx: any) => {
    e.stopPropagation();
    setInvoiceToDelete(tx);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('reseller_user_recharges')
        .delete()
        .eq('id', invoiceToDelete.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['reseller-all-transactions'] });
      toast.success('Transaction deleted');
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const clearDateRange = () => {
    setDateRange(undefined);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-0">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-0">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-destructive/20 text-destructive border-0">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reseller) return null;

  // Map reseller transaction to InvoicePreviewDialog format
  const mappedInvoice = selectedInvoice ? {
    id: selectedInvoice.id,
    created_at: selectedInvoice.created_at,
    amount: selectedInvoice.amount,
    status: selectedInvoice.status,
    type: 'recharge',
    description: selectedInvoice.description,
    radius_users: selectedInvoice.radius_users ? {
      username: selectedInvoice.radius_users.username,
      full_name: selectedInvoice.radius_users.full_name,
      phone: selectedInvoice.radius_users.phone,
      expires_at: selectedInvoice.radius_users.expires_at,
      plan: selectedInvoice.radius_users.plan || undefined,
    } : undefined,
  } : null;

  return (
    <ResellerLayout 
      title={isSuperAdmin ? "All Manage Recharge" : "Manage Recharge"} 
      subtitle="Manage transactions and payment history"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  ৳{stats.total.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stats.count}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by User ID, Name, or Mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={collectByFilter} onValueChange={setCollectByFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Collect By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collectors</SelectItem>
                    {resellerNames.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                {dateRange && (
                  <Button variant="ghost" size="sm" onClick={clearDateRange} className="h-9">
                    <X className="h-4 w-4 mr-1" />
                    Clear dates
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Bill</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Expire Date</TableHead>
                  <TableHead className="text-center">Grace</TableHead>
                  <TableHead>Collect By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow 
                      key={tx.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(tx)}
                    >
                      <TableCell className="font-mono text-sm">
                        {tx.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {format(parseISO(tx.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.radius_users?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">@{tx.radius_users?.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.radius_users?.phone || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        ৳{tx.billing_plans?.price ? Number(tx.billing_plans.price).toLocaleString() : '0'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ৳{Number(tx.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.radius_users?.expires_at 
                          ? format(parseISO(tx.radius_users.expires_at), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {tx.radius_users?.grace_days_used && tx.radius_users.grace_days_used > 0 ? (
                          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                            {tx.radius_users.grace_days_used}d
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.resellers?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteClick(e, tx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Preview Dialog */}
      <InvoicePreviewDialog
        open={invoicePreviewOpen}
        onOpenChange={setInvoicePreviewOpen}
        invoice={mappedInvoice}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove the transaction record</li>
                <li>Reduce user balance by ৳{invoiceToDelete ? Number(invoiceToDelete.amount).toLocaleString() : 0}</li>
                <li>Reduce user expire date by 1 month</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResellerLayout>
  );
}
