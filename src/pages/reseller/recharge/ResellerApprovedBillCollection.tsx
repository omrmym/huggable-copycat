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
import { Loader2, Search, Filter, CreditCard, CheckCircle, CalendarIcon, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function ResellerApprovedBillCollection() {
  const { reseller, isLoading } = useResellerAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [rejecting, setRejecting] = useState<string | null>(null);

  const isSuperAdmin = reseller?.is_super_admin || false;

  useEffect(() => {
    if (!isLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, isLoading, navigate]);

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['reseller-approved-transactions', reseller?.id, isSuperAdmin],
    queryFn: async () => {
      let query = supabase
        .from('reseller_user_recharges')
        .select('*, radius_users(username, full_name, phone), billing_plans(name), resellers(name)')
        .eq('status', 'completed')
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
    const commission = filteredTransactions.reduce((sum, tx) => sum + Number(tx.commission_amount), 0);
    return { total, commission, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleReject = async (txId: string) => {
    setRejecting(txId);
    try {
      const { error } = await supabase
        .from('reseller_user_recharges')
        .update({ status: 'pending' })
        .eq('id', txId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['reseller-approved-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reseller-pending-transactions'] });
      toast.success('Transaction moved to pending');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRejecting(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = searchQuery || startDate || endDate;

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
      title={isSuperAdmin ? "All Approved Bill Collection" : "Approved Bill Collection"} 
      subtitle="View approved transactions"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Total Amount
            </CardDescription>
            <CardTitle className="text-2xl text-success">
              {txLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `৳${stats.total.toLocaleString()}`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Commission Earned
            </CardDescription>
            <CardTitle className="text-2xl text-primary">
              {txLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `৳${stats.commission.toLocaleString()}`}
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

          {hasActiveFilters && (
            <div className="mt-4">
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
          {txLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No approved transactions</h3>
              <p className="text-muted-foreground">No transactions found with the current filters.</p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    {isSuperAdmin && <TableHead>Reseller</TableHead>}
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Cost</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/30">
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
                        ৳{(Number(tx.amount) - Number(tx.commission_amount)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-warning text-warning hover:bg-warning/10"
                          onClick={() => handleReject(tx.id)}
                          disabled={rejecting === tx.id}
                        >
                          {rejecting === tx.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Revert
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </ResellerLayout>
  );
}
