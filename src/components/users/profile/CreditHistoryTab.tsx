import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangeFilter } from '@/components/finance/DateRangeFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';

interface CreditHistoryTabProps {
  userId: string;
}

interface ResellerRecharge {
  id: string;
  reseller_id: string;
  amount: number;
  commission_amount: number;
  commission_rate: number;
  status: string;
  description: string | null;
  created_at: string;
  plan_id: string | null;
  resellers?: { name: string } | null;
  billing_plans?: { name: string } | null;
}

export function CreditHistoryTab({ userId }: CreditHistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: recharges, isLoading } = useQuery({
    queryKey: ['user-credit-history', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reseller_user_recharges')
        .select('*, resellers(name), billing_plans(name)')
        .eq('radius_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ResellerRecharge[];
    },
  });

  const filteredRecharges = useMemo(() => {
    if (!recharges) return [];

    return recharges.filter((recharge) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        recharge.resellers?.name?.toLowerCase().includes(searchLower) ||
        recharge.billing_plans?.name?.toLowerCase().includes(searchLower) ||
        recharge.description?.toLowerCase().includes(searchLower);

      // Date range filter
      const rechargeDate = new Date(recharge.created_at);
      const matchesStartDate = !startDate || rechargeDate >= startDate;
      const matchesEndDate = !endDate || rechargeDate <= new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1);

      // Status filter
      const matchesStatus = statusFilter === 'all' || recharge.status === statusFilter;

      return matchesSearch && matchesStartDate && matchesEndDate && matchesStatus;
    });
  }, [recharges, searchQuery, startDate, endDate, statusFilter]);

  const totalAmount = filteredRecharges.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalCommission = filteredRecharges.reduce((sum, r) => sum + Number(r.commission_amount), 0);

  const handleClearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Credit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Credit History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by reseller, plan, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={handleClearDateFilter}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Recharges</p>
            <p className="text-2xl font-bold">{filteredRecharges.length}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold text-success">৳{totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Commission</p>
            <p className="text-2xl font-bold text-primary">৳{totalCommission.toLocaleString()}</p>
          </div>
        </div>

        {/* Table */}
        {filteredRecharges.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No credit history found</p>
            <p className="text-sm mt-1">Reseller recharges will appear here.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecharges.map((recharge) => (
                  <TableRow key={recharge.id}>
                    <TableCell className="text-sm">
                      {format(new Date(recharge.created_at), 'dd MMM yyyy, hh:mm a')}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary">
                        {recharge.resellers?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{recharge.billing_plans?.name || '-'}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {recharge.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-success font-medium">
                        <ArrowUpCircle className="w-4 h-4" />
                        ৳{Number(recharge.amount).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ৳{Number(recharge.commission_amount).toLocaleString()}
                      <span className="text-xs ml-1">({recharge.commission_rate}%)</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          recharge.status === 'completed'
                            ? 'default'
                            : recharge.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {recharge.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
