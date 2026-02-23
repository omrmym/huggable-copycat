import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Line, ComposedChart } from 'recharts';
import { useUserPaymentChart } from '@/hooks/useUserPaymentChart';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

interface PaymentHistoryChartProps {
  userId: string;
}

const chartConfig = {
  amount: {
    label: 'Amount (৳)',
    color: 'hsl(var(--primary))',
  },
  count: {
    label: 'Transactions',
    color: 'hsl(var(--chart-2))',
  },
};

export function PaymentHistoryChart({ userId }: PaymentHistoryChartProps) {
  const { data: chartData = [], isLoading, isFetching } = useUserPaymentChart(userId);
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['user-payment-chart', userId] });
  };

  const totalAmount = chartData.reduce((sum, d) => sum + d.amount, 0);
  const totalTransactions = chartData.reduce((sum, d) => sum + d.count, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Payment History (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = totalAmount > 0 || totalTransactions > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          Payment History (Last 7 Days)
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold font-mono text-primary">৳{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Amount</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold font-mono text-primary">{totalTransactions}</p>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </div>
        </div>

        {/* Chart or Empty State */}
        {hasData ? (
          <>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  yAxisId="amount"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `৳${value}`}
                />
                <YAxis 
                  yAxisId="count"
                  orientation="right"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />} 
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                />
                <Bar 
                  yAxisId="amount"
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Amount (৳)"
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
                  name="Transactions"
                />
              </ComposedChart>
            </ChartContainer>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-xs text-muted-foreground">Amount (৳)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
                <span className="text-xs text-muted-foreground">Transactions</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No payments in the last 7 days</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Payment data will appear here when transactions are recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
