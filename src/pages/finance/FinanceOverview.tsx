import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { useIncome } from '@/hooks/useIncome';
import { useExpenses } from '@/hooks/useExpenses';
import { useTransactions } from '@/hooks/useTransactions';

export default function FinanceOverview() {
  const { data: incomeList = [], isLoading: incomeLoading } = useIncome();
  const { data: expenseList = [], isLoading: expenseLoading } = useExpenses();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();

  const totalIncome = incomeList.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = expenseList.reduce((sum, item) => sum + Number(item.amount), 0);
  
  // Calculate bill collection from completed transactions
  const totalBillCollection = transactions
    .filter((t) => t.status === 'completed' && t.type === 'payment')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const netProfit = totalIncome - totalExpense;

  const isLoading = incomeLoading || expenseLoading || transactionsLoading;

  // Get recent entries for quick view
  const recentIncome = incomeList.slice(0, 5);
  const recentExpenses = expenseList.slice(0, 5);

  return (
    <DashboardLayout title="Finance Overview" subtitle="Summary of your financial status">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                {transactions.filter((t) => t.status === 'completed' && t.type === 'payment').length} transactions
              </p>
            </CardContent>
          </Card>

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
                {incomeList.length} entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {isLoading ? '...' : `৳${totalExpense.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {expenseList.length} entries
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
