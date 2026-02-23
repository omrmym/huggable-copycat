import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useResellerCredits } from '@/hooks/useResellerCredits';
import { CreditTransferDialog } from '@/components/management/CreditTransferDialog';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useResellers } from '@/hooks/useResellers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { DateRangeFilter } from '@/components/finance/DateRangeFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreditRecharge() {
  const { data: credits, isLoading } = useResellerCredits();
  const { data: resellers } = useResellers();
  const { data: paymentMethods } = usePaymentMethods();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedResellerId, setSelectedResellerId] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  const totalBalance = resellers?.reduce((sum, r) => sum + (r.balance || 0), 0) || 0;

  const filteredCredits = useMemo(() => {
    if (!credits) return [];

    return credits.filter((credit) => {
      // Reseller filter
      if (selectedResellerId !== 'all' && credit.reseller_id !== selectedResellerId) {
        return false;
      }

      // Method filter
      if (selectedMethod !== 'all' && credit.payment_method !== selectedMethod) {
        return false;
      }

      // Date filter
      if (!startDate && !endDate) return true;
      
      const creditDate = parseISO(credit.created_at);
      if (startDate && endDate) {
        return isWithinInterval(creditDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        });
      }
      if (startDate) {
        return creditDate >= startOfDay(startDate);
      }
      if (endDate) {
        return creditDate <= endOfDay(endDate);
      }
      return true;
    });
  }, [credits, startDate, endDate, selectedResellerId, selectedMethod]);

  const clearFilters = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(new Date());
    setSelectedResellerId('all');
    setSelectedMethod('all');
  };

  const filteredTotalCredits = filteredCredits.filter(c => c.type === 'credit').reduce((sum, c) => sum + c.amount, 0);
  const filteredCreditCount = filteredCredits.filter(c => c.type === 'credit').length;

  return (
    <DashboardLayout title="Credit Recharge" subtitle="Transfer credits to reseller accounts">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={clearFilters}
            />
            <Select value={selectedResellerId} onValueChange={setSelectedResellerId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Resellers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resellers</SelectItem>
                {resellers?.map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {paymentMethods?.filter(m => m.is_active).map((method) => (
                  <SelectItem key={method.id} value={method.name}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Transfer Credit
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reseller Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">৳{totalBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across {resellers?.length || 0} resellers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Transferred (Filtered)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ৳{filteredTotalCredits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredCreditCount} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Credit Transaction History ({filteredCredits.length})</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No credit transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCredits.map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell>{format(new Date(credit.created_at), 'dd MMM yyyy, hh:mm a')}</TableCell>
                      <TableCell className="font-medium">{credit.resellers?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={credit.type === 'credit' ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                          {credit.type === 'credit' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          {credit.type === 'credit' ? 'Credit' : 'Debit'}
                        </Badge>
                      </TableCell>
                      <TableCell className={credit.type === 'credit' ? 'text-green-500' : 'text-red-500'}>
                        {credit.type === 'credit' ? '+' : '-'}৳{credit.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{credit.payment_method || '-'}</Badge>
                      </TableCell>
                      <TableCell>৳{credit.balance_after.toLocaleString()}</TableCell>
                      <TableCell>{credit.description || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <CreditTransferDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </DashboardLayout>
  );
}
