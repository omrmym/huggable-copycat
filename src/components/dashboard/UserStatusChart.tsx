import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useRadiusUsers } from '@/hooks/useRadiusUsers';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = {
  online: 'hsl(var(--online))',
  offline: 'hsl(var(--offline))',
};

export function UserStatusChart() {
  const navigate = useNavigate();
  const { data: allUsers = [], isLoading: usersLoading } = useRadiusUsers();
  const { data: onlineData, isLoading: onlineLoading } = useOnlineUsers();

  const onlineUsernames = onlineData?.onlineUsernames || [];

  // Filter to admin-only users (no reseller)
  const adminUsers = useMemo(() => allUsers.filter(u => !u.reseller_id), [allUsers]);

  const onlineCount = useMemo(() => 
    adminUsers.filter(u => onlineUsernames.includes(u.username)).length, 
    [adminUsers, onlineUsernames]
  );
  const totalUsers = adminUsers.length;
  const offlineCount = Math.max(0, totalUsers - onlineCount);

  const isLoading = usersLoading || onlineLoading;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    );
  }

  // Online/Offline distribution data
  const onlineOfflineData = [
    { name: 'Online', value: onlineCount, color: COLORS.online },
    { name: 'Offline', value: offlineCount, color: COLORS.offline },
  ].filter(item => item.value > 0);

  const handlePieClick = (data: { name: string }) => {
    const status = data.name.toLowerCase();
    navigate(`/users/online-offline?status=${status}`);
  };

  if (totalUsers === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">User Status Distribution</h3>
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
              data={onlineOfflineData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              label={({ cx, cy, name, percent, index }) => {
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
              {onlineOfflineData.map((entry, index) => (
                <Cell key={`cell-online-${index}`} fill={entry.color} strokeWidth={0} />
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
          onClick={() => navigate('/users/online-offline?status=online')}
        >
          {onlineCount}
        </span> online / <span 
          className="text-offline font-semibold cursor-pointer hover:underline"
          onClick={() => navigate('/users/online-offline?status=offline')}
        >
          {offlineCount}
        </span> offline
      </div>
    </div>
  );
}
