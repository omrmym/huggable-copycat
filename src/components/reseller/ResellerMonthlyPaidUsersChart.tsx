import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useResellerMonthlyPaidUsers } from '@/hooks/useResellerDashboardCharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface Props {
  resellerId: string | undefined;
  isSuperAdmin?: boolean;
  sessionToken?: string | null;
}

export function ResellerMonthlyPaidUsersChart({ resellerId, isSuperAdmin = false, sessionToken = null }: Props) {
  const { data, isLoading } = useResellerMonthlyPaidUsers(resellerId, isSuperAdmin, sessionToken);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  const currentMonthUsers = data?.[data.length - 1]?.users || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-warning" />
          Monthly Paid Users
        </h3>
        <span className="text-sm text-muted-foreground">
          This Month: {currentMonthUsers}
        </span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [value, 'Paid Users']}
            />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke="hsl(var(--warning))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'hsl(var(--warning))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
