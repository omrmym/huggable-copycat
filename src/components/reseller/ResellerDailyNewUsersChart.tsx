import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useResellerDailyNewUsers } from '@/hooks/useResellerDashboardCharts';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus } from 'lucide-react';

interface Props {
  resellerId: string | undefined;
  isSuperAdmin?: boolean;
  sessionToken?: string | null;
}

export function ResellerDailyNewUsersChart({ resellerId, isSuperAdmin = false, sessionToken = null }: Props) {
  const { data, isLoading } = useResellerDailyNewUsers(resellerId, isSuperAdmin, sessionToken);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  const todayNewUsers = data?.[data.length - 1]?.users || 0;
  const totalNewUsers = data?.reduce((sum, d) => sum + d.users, 0) || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-destructive" />
          Day Wise New Line
        </h3>
        <span className="text-sm text-muted-foreground">
          Today: {todayNewUsers} | Week: {totalNewUsers}
        </span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="day" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [value, 'New Users']}
            />
            <Bar dataKey="users" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
