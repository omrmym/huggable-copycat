import { useNavigate } from 'react-router-dom';
import { UserStatusBadge } from '@/components/dashboard/UserStatusBadge';
import { Wifi, Network, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillingPlans } from '@/hooks/useBillingPlans';

interface RecentUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: 'online' | 'offline' | 'expired' | 'suspended' | 'active' | 'disabled';
  serviceType: 'hotspot' | 'pppoe';
  planId: string;
  dataUsed: number;
  dataLimit: number | null;
}

interface ResellerRecentUsersTableProps {
  users: RecentUser[];
  isLoading?: boolean;
}

export function ResellerRecentUsersTable({ users, isLoading }: ResellerRecentUsersTableProps) {
  const navigate = useNavigate();
  const { data: plans = [] } = useBillingPlans();

  const getPlanName = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.name || 'Unknown';
  };

  const formatDataUsage = (used: number, limit: number | null) => {
    const usedGB = (used / 1024).toFixed(1);
    if (limit === null) return `${usedGB} GB`;
    const limitGB = (limit / 1024).toFixed(1);
    return `${usedGB} / ${limitGB} GB`;
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Recent Users</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary"
          onClick={() => navigate('/reseller/users')}
        >
          View All
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Plan
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Usage
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr 
                  key={user.id} 
                  className="data-table-row cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/reseller/users/${user.id}`)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {user.username}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wifi className="w-4 h-4 text-primary" />
                      <span className="text-sm">Hotspot</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-foreground">
                      {getPlanName(user.planId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatDataUsage(user.dataUsed, user.dataLimit)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/reseller/users/${user.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Recharge</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
