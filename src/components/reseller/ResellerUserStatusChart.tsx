import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useResellerOnlineUsers } from '@/hooks/useResellerDashboardCharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = {
  online: 'hsl(var(--online))',
  offline: 'hsl(var(--offline))',
};

interface Props {
  resellerId: string | undefined;
  isSuperAdmin?: boolean;
  sessionToken?: string | null;
}

export function ResellerUserStatusChart({ resellerId, isSuperAdmin = false, sessionToken = null }: Props) {
  const navigate = useNavigate();
  const { data: onlineData, isLoading } = useResellerOnlineUsers(resellerId, isSuperAdmin, sessionToken);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    );
  }

  const totalUsers = onlineData?.totalUsers || 0;
  const onlineCount = onlineData?.onlineCount || 0;
  const offlineCount = Math.max(0, totalUsers - onlineCount);

  // Online/Offline distribution data
  const chartData = [
    { name: 'Online', value: onlineCount, color: COLORS.online },
    { name: 'Offline', value: offlineCount, color: COLORS.offline },
  ].filter(item => item.value > 0);

  const handlePieClick = (data: { name: string }) => {
    const status = data.name.toLowerCase();
    navigate(`/reseller/users/online-offline?status=${status}`);
  };

  if (totalUsers === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Online / Offline Status</h3>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No users found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-foreground mb-4">Online / Offline Status</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              label={({ cx, cy, name, percent }) => {
                // Position labels on left and right sides
                const isOnline = name === 'Online';
                const x = isOnline ? cx + 95 : cx - 95;
                const y = cy;
                return (
                  <text
                    x={x}
                    y={y}
                    fill="hsl(var(--foreground))"
                    textAnchor={isOnline ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={11}
                  >
                    {`${name} ${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
              labelLine={false}
              onClick={handlePieClick}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [value, 'Users']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))', cursor: 'pointer' }}>{value}</span>
              )}
              onClick={(e) => handlePieClick({ name: e.value })}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center text-sm text-muted-foreground mt-2">
        <span 
          className="text-online font-semibold cursor-pointer hover:underline"
          onClick={() => navigate('/reseller/users/online-offline?status=online')}
        >
          {onlineCount}
        </span> online / <span 
          className="text-offline font-semibold cursor-pointer hover:underline"
          onClick={() => navigate('/reseller/users/online-offline?status=offline')}
        >
          {offlineCount}
        </span> offline
      </div>
    </div>
  );
}
