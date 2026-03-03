import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, CreditCard, CalendarIcon, Link } from 'lucide-react';
import { useIncome } from '@/hooks/useIncome';
import { useExpenses } from '@/hooks/useExpenses';
import { useTransactions } from '@/hooks/useTransactions';
import { useRadiusUsers } from '@/hooks/useRadiusUsers';
import { useSalaryPayments } from '@/hooks/useSalaryPayments';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from 'date-fns';

export default function FinanceOverview() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: incomeList = [], isLoading: incomeLoading } = useIncome();
  const { data: expenseList = [], isLoading: expenseLoading } = useExpenses();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: radiusUsers = [], isLoading: usersLoading } = useRadiusUsers();
  const { data: salaryPayments = [], isLoading: salaryLoading } = useSalaryPayments();

  const isLoading = incomeLoading || expenseLoading || transactionsLoading || usersLoading || salaryLoading;

  // Filter helper
  const isInRange = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (startDate && endDate) {
      return isWithinInterval(date, { start: startOfDay(startDate), end: endOfDay(endDate) });
    }
    if (startDate) return date >= startOfDay(startDate);
    if (endDate) return date <= endOfDay(endDate);
    return true;
  };

  const filteredIncome = useMemo(() => incomeList.filter(i => isInRange(i.date)), [incomeList, startDate, endDate]);
  const filteredExpenses = useMemo(() => expenseList.filter(e => isInRange(e.date)), [expenseList, startDate, endDate]);
  const filteredTransactions = useMemo(() => transactions.filter(t => isInRange(t.created_at)), [transactions, startDate, endDate]);
  const filteredUsers = useMemo(() => radiusUsers.filter(u => u.connection_date && isInRange(u.connection_date)), [radiusUsers, startDate, endDate]);
  const filteredSalaryPayments = useMemo(() => salaryPayments.filter(s => isInRange(s.payment_date)), [salaryPayments, startDate, endDate]);

  const extraIncome = filteredIncome.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpenseAmount = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  const completedPayments = filteredTransactions.filter((t) => t.status === 'completed' && t.type === 'payment');
  const totalBillCollection = completedPayments.reduce((sum, t) => sum + Number(t.amount), 0);

  const connectionFee = filteredUsers.reduce((sum, u) => sum + Number(u.connection_fee || 0), 0);
  const totalSalary = filteredSalaryPayments.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.net_salary), 0);

  // Total Income = Bill Collection + Connection Fee + Extra Income
  const totalIncome = totalBillCollection + connectionFee + extraIncome;
  // Total Expenses = Expenses + Salary
  const totalExpenses = totalExpenseAmount + totalSalary;
  // Net Profit = Total Income - Total Expenses
  const netProfit = totalIncome - totalExpenses;

  const recentIncome = filteredIncome.slice(0, 5);
  const recentExpenses = filteredExpenses.slice(0, 5);

  return (
    <DashboardLayout title="Finance Overview" subtitle="Summary of your financial status">
      <div className="space-y-6">
        {/* Date Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd MMM yyyy") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd MMM yyyy") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="sm" onClick={() => { setStartDate(startOfMonth(new Date())); setEndDate(new Date()); }}>
            Reset
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bill Collection</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {isLoading ? '...' : `৳${totalBillCollection.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {completedPayments.length} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connection Fee</CardTitle>
              <Link className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {isLoading ? '...' : `৳${connectionFee.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredUsers.length} connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Extra Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {isLoading ? '...' : `৳${extraIncome.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredIncome.length} entries
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {isLoading ? '...' : `৳${totalIncome.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Bill + Connection Fee + Income
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {isLoading ? '...' : `৳${totalExpenseAmount.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredExpenses.length} entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salary Paid</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {isLoading ? '...' : `৳${totalSalary.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredSalaryPayments.filter(s => s.status === 'paid').length} payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <Wallet className={`h-4 w-4 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {isLoading ? '...' : `৳${netProfit.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {netProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-success" />
                Recent Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : recentIncome.length === 0 ? (
                <p className="text-muted-foreground text-sm">No income entries yet</p>
              ) : (
                <div className="space-y-3">
                  {recentIncome.map((income) => (
                    <div key={income.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{income.category || 'Uncategorized'}</p>
                        <p className="text-xs text-muted-foreground">{income.added_by || 'Unknown'}</p>
                      </div>
                      <span className="text-sm font-medium text-success">
                        +৳{Number(income.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
                Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : recentExpenses.length === 0 ? (
                <p className="text-muted-foreground text-sm">No expense entries yet</p>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{expense.category || 'Uncategorized'}</p>
                        <p className="text-xs text-muted-foreground">{expense.added_by || 'Unknown'}</p>
                      </div>
                      <span className="text-sm font-medium text-destructive">
                        -৳{Number(expense.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
