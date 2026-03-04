import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeleteTransaction } from '@/hooks/useTransactions';
import { InvoicePreviewDialog } from '@/components/invoice/InvoicePreviewDialog';
import { Search, Filter, CreditCard, CheckCircle2, Trash2, CalendarIcon, X } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface TransactionWithUser {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  type: string;
  description: string | null;
  collected_by: string | null;
  payment_method: string | null;
  radius_user_id: string | null;
  radius_users: {
    id: string;
    username: string;
    full_name: string | null;
    phone: string | null;
    expires_at: string | null;
    billing_cycle: string | null;
    plan_id: string | null;
    grace_days_used: number;
    plan: {
      id: string;
      name: string;
      price: number;
    } | null;
  } | null;
}

export default function ManageRecharge() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collectByFilter, setCollectByFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedInvoice, setSelectedInvoice] = useState<TransactionWithUser | null>(null);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<TransactionWithUser | null>(null);

  const deleteTransaction = useDeleteTransaction();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions-with-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          radius_users (
            id,
            username,
            full_name,
            phone,
            expires_at,
            billing_cycle,
            plan_id,
            grace_days_used,
            plan:billing_plans (
              id,
              name,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TransactionWithUser[];
    },
  });


  const filteredTransactions = transactions?.filter(tx => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      tx.radius_users?.username?.toLowerCase().includes(searchLower) ||
      tx.radius_users?.full_name?.toLowerCase().includes(searchLower) ||
      tx.radius_users?.phone?.toLowerCase().includes(searchLower) ||
      tx.description?.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    
    // Collect By filter
    const collectBy = tx.collected_by || 'Unknown';
    const matchesCollectBy = collectByFilter === 'all' || collectBy === collectByFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange?.from) {
      const txDate = new Date(tx.created_at);
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      matchesDateRange = isWithinInterval(txDate, { start: from, end: to });
    }
    
    return matchesSearch && matchesStatus && matchesCollectBy && matchesDateRange;
  });

  const clearDateRange = () => {
    setDateRange(undefined);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-0">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-0">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive border-0">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleRowClick = (tx: TransactionWithUser) => {
    setSelectedInvoice(tx);
    setInvoicePreviewOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, tx: TransactionWithUser) => {
    e.stopPropagation();
    setInvoiceToDelete(tx);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;

    await deleteTransaction.mutateAsync({
      transactionId: invoiceToDelete.id,
      userId: invoiceToDelete.radius_user_id,
      amount: Number(invoiceToDelete.amount),
      billingCycle: invoiceToDelete.radius_users?.billing_cycle || 'monthly',
    });

    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  return (
    <DashboardLayout title="Manage Recharge" subtitle="Manage transactions and payment history">
      <div className="space-y-6">
        {/* Stats Cards - Dynamic based on filters */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  ৳{filteredTransactions?.filter(tx => tx.status === 'completed').reduce((sum, tx) => sum + Number(tx.amount), 0).toLocaleString() || 0}
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
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{filteredTransactions?.length || 0}</div>
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
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={collectByFilter} onValueChange={setCollectByFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Collect By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collectors</SelectItem>
                    {Array.from(new Set(transactions?.map(tx => tx.collected_by).filter(Boolean) || [])).map(name => (
                      <SelectItem key={name} value={name!}>{name}</SelectItem>
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredTransactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions?.map((tx) => (
                    <TableRow 
                      key={tx.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(tx)}
                    >
                      <TableCell className="font-mono text-sm">
                        {tx.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
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
                        ৳{tx.radius_users?.plan?.price ? Number(tx.radius_users.plan.price).toLocaleString() : '0'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ৳{Number(tx.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.radius_users?.expires_at 
                          ? format(new Date(tx.radius_users.expires_at), 'MMM d, yyyy')
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
                        {tx.collected_by || 'Unknown'}
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
        invoice={selectedInvoice ? {
          ...selectedInvoice,
          radius_users: selectedInvoice.radius_users ? {
            ...selectedInvoice.radius_users,
            plan: selectedInvoice.radius_users.plan || undefined
          } : undefined
        } : null}
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
                <li>Reduce user expire date by {invoiceToDelete?.radius_users?.billing_cycle === 'monthly' ? '1 month' : '30 days'}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={deleteTransaction.isPending}
            >
              {deleteTransaction.isPending ? 'Deleting...' : 'Delete Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
