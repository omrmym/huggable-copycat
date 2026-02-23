import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResellerDashboardStats } from '@/hooks/useResellerDashboardStats';
import { ResellerStatCards } from '@/components/reseller/ResellerStatCards';
import { ResellerMonthlyBillCollectionChart } from '@/components/reseller/ResellerMonthlyBillCollectionChart';
import { ResellerDailyBillCollectionChart } from '@/components/reseller/ResellerDailyBillCollectionChart';
import { ResellerMonthlyPaidUsersChart } from '@/components/reseller/ResellerMonthlyPaidUsersChart';
import { ResellerDailyNewUsersChart } from '@/components/reseller/ResellerDailyNewUsersChart';
import { ResellerUserStatusChart } from '@/components/reseller/ResellerUserStatusChart';
import { ResellerRecentUsersTable } from '@/components/reseller/ResellerRecentUsersTable';

export default function ResellerDashboard() {
  const { reseller, sessionToken, isLoading } = useResellerAuth();
  const navigate = useNavigate();

  const isSuperAdmin = reseller?.is_super_admin || false;

  useEffect(() => {
    if (!isLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, isLoading, navigate]);

  const { data: stats, isLoading: statsLoading } = useResellerDashboardStats(reseller?.id, isSuperAdmin, sessionToken);

  // Fetch recent users using edge function to bypass RLS
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['reseller-recent-users', reseller?.id, isSuperAdmin],
    queryFn: async () => {
      if (!reseller?.id && !isSuperAdmin) return [];
      
      const { data, error } = await supabase.functions.invoke('reseller-get-users', {
        body: {
          resellerId: reseller?.id,
          isSuperAdmin,
          session_token: sessionToken,
        },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch users');
      
      const allUsers = data.users || [];
      return allUsers.slice(0, 10);
    },
    enabled: (!!reseller?.id || isSuperAdmin) && !!sessionToken,
  });

  // Map users to the format expected by RecentUsersTable
  const recentUsers = users.map((user: any) => ({
    id: user.id,
    fullName: user.full_name || user.username,
    username: user.username,
    email: user.email || '',
    status: user.status,
    serviceType: user.service_type,
    planId: user.plan_id || '',
    dataUsed: user.data_used_mb,
    dataLimit: user.billing_plans?.data_limit_mb ?? null,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reseller) {
    return null;
  }

  return (
    <ResellerLayout 
      title={isSuperAdmin ? "All Resellers Dashboard" : "Dashboard"} 
      subtitle={isSuperAdmin ? "Overview of all reseller accounts" : "Overview of your reseller account"}
    >
      {/* Stat Cards - same layout as admin dashboard */}
      <ResellerStatCards stats={stats} isLoading={statsLoading} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ResellerMonthlyBillCollectionChart resellerId={reseller.id} isSuperAdmin={isSuperAdmin} />
        <ResellerDailyBillCollectionChart resellerId={reseller.id} isSuperAdmin={isSuperAdmin} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ResellerMonthlyPaidUsersChart resellerId={reseller.id} isSuperAdmin={isSuperAdmin} />
        <ResellerDailyNewUsersChart resellerId={reseller.id} isSuperAdmin={isSuperAdmin} />
      </div>

      {/* User Status Chart - Full width like Admin Dashboard */}
      <div className="mb-6">
        <ResellerUserStatusChart resellerId={reseller.id} isSuperAdmin={isSuperAdmin} />
      </div>

      {/* Recent Users Table */}
      <ResellerRecentUsersTable users={recentUsers} isLoading={usersLoading} />
    </ResellerLayout>
  );
}
