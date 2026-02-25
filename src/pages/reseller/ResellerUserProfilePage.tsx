import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResellerAuth } from '@/contexts/ResellerAuthContext';
import { ResellerLayout } from '@/components/reseller/ResellerLayout';
import { PortalLinkCard } from '@/components/portal/PortalLinkCard';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { useAreas } from '@/hooks/useAreas';
import { useDistricts } from '@/hooks/useDistricts';
import { usePoliceStations } from '@/hooks/usePoliceStations';
import { useMikrotikRouters } from '@/hooks/useMikrotikRouters';
import { useResellerAssignedPlans } from '@/hooks/useResellerAssignedPlans';
import { UserStatusBadge } from '@/components/dashboard/UserStatusBadge';
import { ResellerRechargeDialog } from '@/components/reseller/ResellerRechargeDialog';
import { ResellerEditUserDialog } from '@/components/reseller/ResellerEditUserDialog';
import { UserOverviewTab } from '@/components/users/profile/UserOverviewTab';
import { TransactionHistoryTab } from '@/components/users/profile/TransactionHistoryTab';
import { DataUsageTab } from '@/components/users/profile/DataUsageTab';
import { BandwidthLiveChart } from '@/components/users/profile/BandwidthLiveChart';
import { BandwidthHistoryChart } from '@/components/users/profile/BandwidthHistoryChart';
import { ActivityLogTab } from '@/components/users/profile/ActivityLogTab';
import { GraceActivationDialog } from '@/components/users/profile/GraceActivationDialog';
import { calculateProratedPrice } from '@/lib/proratedPricing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  User,
  Wifi,
  Network,
  Calendar,
  CreditCard,
  Banknote,
  LayoutGrid,
  History,
  HardDrive,
  Activity,
  Loader2,
  Key,
  Package,
  Clock,
  Edit,
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { UserStatus, ServiceType } from '@/hooks/useRadiusUsers';

type RadiusUserWithPlan = Omit<Tables<'radius_users'>, 'service_type' | 'status'> & {
  service_type: ServiceType;
  status: UserStatus;
  plan?: Tables<'billing_plans'> | null;
};

export default function ResellerUserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { reseller, sessionToken, isLoading: authLoading } = useResellerAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [graceDialogOpen, setGraceDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !reseller) {
      navigate('/reseller/login', { replace: true });
    }
  }, [reseller, authLoading, navigate]);

  const isSuperAdmin = reseller?.is_super_admin === true;

  // Fetch user data via edge function to bypass RLS
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['reseller-user-profile', userId, reseller?.id, isSuperAdmin],
    queryFn: async (): Promise<RadiusUserWithPlan | null> => {
      if (!userId || !reseller?.id) return null;
      
      const { data, error } = await supabase.functions.invoke('reseller-get-user', {
        body: { 
          resellerId: reseller.id, 
          isSuperAdmin,
          userId,
          session_token: sessionToken,
        },
      });

      if (error || !data?.success) return null;
      return data.user as RadiusUserWithPlan;
    },
    enabled: !!userId && !!reseller?.id,
  });

  // Fetch user transactions via edge function to bypass RLS
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['reseller-user-transactions', userId, reseller?.id, isSuperAdmin],
    queryFn: async () => {
      if (!userId || !reseller?.id) return [];
      
      const { data, error } = await supabase.functions.invoke('reseller-get-user-transactions', {
        body: { 
          resellerId: reseller.id, 
          isSuperAdmin,
          userId,
          session_token: sessionToken,
        },
      });

      if (error || !data?.success) return [];
      return data.transactions;
    },
    enabled: !!userId && !!reseller?.id,
  });

  const { data: plans = [] } = useBillingPlans();
  const { data: areas = [] } = useAreas();
  const { data: districts = [] } = useDistricts();
  const { data: policeStations = [] } = usePoliceStations();
  const { data: routers = [] } = useMikrotikRouters();
  const { data: assignedPlans = [] } = useResellerAssignedPlans(reseller?.id);

  // Filter plans to only those assigned to this reseller
  const filteredPlans = useMemo(() => {
    if (!user?.service_type) return [];
    const assignedPlanIds = assignedPlans.map(ap => ap.id);
    return plans.filter(plan => 
      plan.service_type === user.service_type && 
      assignedPlanIds.includes(plan.id)
    );
  }, [plans, assignedPlans, user?.service_type]);

  const getPlanName = (planId: string | null) => {
    if (!planId) return 'No plan';
    const plan = plans.find((p) => p.id === planId);
    return plan?.name || 'Unknown';
  };

  const getAreaName = (areaId: string | null) => {
    if (!areaId) return '-';
    const area = areas.find((a) => a.id === areaId);
    return area?.name || '-';
  };

  const getDistrictName = (districtId: string | null) => {
    if (!districtId) return '-';
    const district = districts.find((d) => d.id === districtId);
    return district?.name || '-';
  };

  const getPoliceStationName = (psId: string | null) => {
    if (!psId) return '-';
    const ps = policeStations.find((p) => p.id === psId);
    return ps?.name || '-';
  };

  const getRouterName = (routerId: string | null) => {
    if (!routerId) return '-';
    const router = routers.find((r) => r.id === routerId);
    return router?.name || '-';
  };

  const handleChangeCredentials = async () => {
    if (!user || (!newPassword.trim() && !newUsername.trim())) return;
    setIsUpdating(true);
    
    try {
      const updates: Record<string, unknown> = {};
      if (newPassword.trim()) {
        updates.password_hash = newPassword;
      }
      if (newUsername.trim()) {
        updates.username = newUsername;
      }
      
      const { error } = await supabase.functions.invoke('reseller-update-user', {
        body: {
          resellerId: reseller?.id,
          isSuperAdmin,
          userId: user.id,
          updates: { ...updates, mikrotik_synced: false },
          session_token: sessionToken,
        },
      });
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Credentials updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['reseller-user-profile'] });
      setPasswordDialogOpen(false);
      setNewPassword('');
      setNewUsername('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update credentials', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePlan = async () => {
    if (!user || !selectedPlanId) return;
    const plan = filteredPlans.find(p => p.id === selectedPlanId);
    if (!plan) return;
    
    setIsUpdating(true);
    
    try {
      // If user is not expired, calculate prorated price based on remaining days
      let amountToDeduct = 0;
      if (user.status !== 'expired') {
        const planPrice = Number(plan.price);
        const currentPlanPrice = Number(user.plan?.price || 0);
        const proratedResult = calculateProratedPrice(user.expires_at, planPrice, currentPlanPrice, user.billing_cycle || 'monthly');
        amountToDeduct = proratedResult.isValid ? proratedResult.proratedAmount : planPrice;
        
        if (user.balance < amountToDeduct) {
          toast({ title: 'Error', description: 'Insufficient balance for plan change', variant: 'destructive' });
          setIsUpdating(false);
          return;
        }
      }
      
      const updates: Record<string, unknown> = {
        plan_id: selectedPlanId,
        monthly_bill: plan.price,
        mikrotik_synced: false,
      };
      
      if (amountToDeduct > 0) {
        updates.balance = user.balance - amountToDeduct;
      }
      
      const { error } = await supabase.functions.invoke('reseller-update-user', {
        body: {
          resellerId: reseller?.id,
          isSuperAdmin,
          userId: user.id,
          updates,
          session_token: sessionToken,
        },
      });
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Plan changed successfully' });
      queryClient.invalidateQueries({ queryKey: ['reseller-user-profile'] });
      setPlanDialogOpen(false);
      setSelectedPlanId('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to change plan', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || userLoading) {
    return (
      <ResellerLayout title="User Profile" subtitle="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </ResellerLayout>
    );
  }

  if (!reseller) return null;

  if (!user) {
    return (
      <ResellerLayout title="User Not Found" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">The requested user could not be found or you don't have access.</p>
          <Button onClick={() => navigate('/reseller/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Users
          </Button>
        </div>
      </ResellerLayout>
    );
  }

  return (
    <ResellerLayout title="User Profile" subtitle={user.username}>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate('/reseller/users')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Users
        </Button>
        <div className="flex flex-wrap gap-2">
          {user.status === 'expired' && (
            <Button 
              variant="outline"
              className="border-warning text-warning hover:bg-warning/10"
              onClick={() => setGraceDialogOpen(true)}
            >
              <Clock className="w-4 h-4 mr-2" />
              Grace Activation
              {user.grace_days_used > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-warning/20 rounded">
                  {user.grace_days_used}d pending
                </span>
              )}
            </Button>
          )}
          <Button 
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            onClick={() => setRechargeDialogOpen(true)}
          >
            <Banknote className="w-4 h-4 mr-2" />
            Quick Recharge
          </Button>
          <Button 
            variant="outline"
            onClick={() => setPasswordDialogOpen(true)}
          >
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          <Button 
            variant="outline"
            onClick={() => setPlanDialogOpen(true)}
          >
            <Package className="w-4 h-4 mr-2" />
            Change Plan
          </Button>
          <Button 
            className="bg-gradient-primary text-primary-foreground"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit User
          </Button>
        </div>
      </div>

      {/* User Overview Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {user.full_name || user.username}
                </h2>
                <UserStatusBadge status={user.status} />
              </div>
              <p className="text-muted-foreground font-mono text-lg mb-2">@{user.username}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  {user.service_type === 'hotspot' ? (
                    <Wifi className="w-4 h-4" />
                  ) : (
                    <Network className="w-4 h-4" />
                  )}
                  <span className="capitalize">{user.service_type}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  <span>৳{user.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portal Link */}
      <div className="mb-6">
        <PortalLinkCard userId={user.id} userName={user.full_name || user.username} username={user.username} />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="data-usage" className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            <span className="hidden sm:inline">Data Usage</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Activity Log</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <UserOverviewTab
            user={user}
            getPlanName={getPlanName}
            getAreaName={getAreaName}
            getDistrictName={getDistrictName}
            getPoliceStationName={getPoliceStationName}
            getRouterName={getRouterName}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionHistoryTab
            transactions={transactions}
            isLoading={transactionsLoading}
            userId={user.id}
            billingCycle={user.billing_cycle || 'monthly'}
            userDetails={{
              username: user.username,
              full_name: user.full_name,
              phone: user.phone,
              expires_at: user.expires_at,
              plan: user.plan ? {
                name: user.plan.name,
                price: user.plan.price
              } : undefined
            }}
          />
        </TabsContent>

        <TabsContent value="data-usage">
          <div className="space-y-6">
            <BandwidthLiveChart 
              userId={user.id} 
              username={user.username}
              serviceType={user.service_type}
              routerId={user.mikrotik_router_id}
            />
            <BandwidthHistoryChart 
              userId={user.id}
              username={user.username}
            />
            <DataUsageTab user={user} />
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogTab userId={user.id} lastLoginAt={user.last_login_at} username={user.username} />
        </TabsContent>
      </Tabs>

      {/* Recharge Dialog */}
      <ResellerRechargeDialog
        open={rechargeDialogOpen}
        onOpenChange={setRechargeDialogOpen}
        user={user}
        resellerId={reseller.id}
      />

      {/* Change Credentials Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Change Credentials
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Username</Label>
              <p className="text-sm font-mono text-muted-foreground">@{user.username}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-username">New Username</Label>
              <Input
                id="new-username"
                type="text"
                placeholder="Enter new username (leave empty to keep current)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="text"
                placeholder="Enter new password (leave empty to keep current)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={handleChangeCredentials}
              disabled={isUpdating || (!newPassword.trim() && !newUsername.trim())}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Change Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <p className="text-sm font-mono text-muted-foreground">@{user.username}</p>
            </div>
            <div className="space-y-2">
              <Label>Current Plan</Label>
              <p className="text-sm text-muted-foreground">
                {user.plan?.name || 'No plan assigned'}
                {user.plan && ` - ৳${Number(user.plan.price).toLocaleString()}`}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className={`text-sm font-medium ${user.balance < 0 ? 'text-destructive' : 'text-primary'}`}>
                ৳{user.balance.toLocaleString()}
              </p>
            </div>
            {user.status !== 'expired' && user.expires_at && (
              <div className="space-y-2">
                <Label>Remaining Days</Label>
                <p className="text-sm text-muted-foreground">
                  {Math.max(0, Math.ceil((new Date(user.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days until expiry
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-plan">Select New Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ৳{Number(plan.price).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPlanId && user.status !== 'expired' && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Prorated Cost Preview</p>
                {(() => {
                  const plan = filteredPlans.find(p => p.id === selectedPlanId);
                  if (!plan) return null;
                  const planPrice = Number(plan.price);
                  const currentPlanPrice = Number(user.plan?.price || 0);
                  const proratedResult = calculateProratedPrice(user.expires_at, planPrice, currentPlanPrice, user.billing_cycle || 'monthly');
                  const amount = proratedResult.isValid ? proratedResult.proratedAmount : planPrice;
                  const hasEnoughBalance = user.balance >= amount;
                  
                  return (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Required Balance: <span className={hasEnoughBalance ? 'text-primary' : 'text-destructive'}>৳{amount.toLocaleString()}</span>
                      </p>
                      {!hasEnoughBalance && (
                        <p className="text-sm text-destructive">
                          Insufficient balance. Need ৳{(amount - user.balance).toLocaleString()} more.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={handleChangePlan}
              disabled={isUpdating || !selectedPlanId}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Change Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grace Activation Dialog */}
      <GraceActivationDialog
        open={graceDialogOpen}
        onOpenChange={setGraceDialogOpen}
        user={user}
      />

      {/* Edit User Dialog */}
      <ResellerEditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
        resellerId={reseller.id}
        isSuperAdmin={isSuperAdmin}
      />
    </ResellerLayout>
  );
}
