import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PortalLinkCard } from '@/components/portal/PortalLinkCard';
import { useRadiusUsers, useUpdateRadiusUser } from '@/hooks/useRadiusUsers';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { useAreas } from '@/hooks/useAreas';
import { useDistricts } from '@/hooks/useDistricts';
import { usePoliceStations } from '@/hooks/usePoliceStations';
import { useMikrotikRouters } from '@/hooks/useMikrotikRouters';
import { useUserTransactions } from '@/hooks/useTransactions';
import { UserStatusBadge } from '@/components/dashboard/UserStatusBadge';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { RechargeDialog } from '@/components/recharge/RechargeDialog';
import { UserOverviewTab } from '@/components/users/profile/UserOverviewTab';
import { TransactionHistoryTab } from '@/components/users/profile/TransactionHistoryTab';
import { DataUsageTab } from '@/components/users/profile/DataUsageTab';
import { BandwidthLiveChart } from '@/components/users/profile/BandwidthLiveChart';
import { BandwidthHistoryChart } from '@/components/users/profile/BandwidthHistoryChart';
import { ActivityLogTab } from '@/components/users/profile/ActivityLogTab';
import { GraceActivationDialog } from '@/components/users/profile/GraceActivationDialog';
import { sendSms } from '@/hooks/useSendSms';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Edit,
  Banknote,
  LayoutGrid,
  History,
  HardDrive,
  Activity,
  Key,
  Package,
  Loader2,
  Clock,
  MessageSquare,
  Send,
} from 'lucide-react';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [graceDialogOpen, setGraceDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  
  const { data: users = [], isLoading: usersLoading } = useRadiusUsers();
  const { data: plans = [] } = useBillingPlans();
  const { data: areas = [] } = useAreas();
  const { data: districts = [] } = useDistricts();
  const { data: policeStations = [] } = usePoliceStations();
  const { data: routers = [] } = useMikrotikRouters();
  const { data: transactions = [], isLoading: transactionsLoading } = useUserTransactions(userId);
  const updateUser = useUpdateRadiusUser();
  

  const user = users.find((u) => u.id === userId);

  // Filter plans by user's service type
  const filteredPlans = useMemo(() => {
    if (!user?.service_type) return plans;
    return plans.filter(plan => plan.service_type === user.service_type);
  }, [plans, user?.service_type]);

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
    const updates: Record<string, unknown> = {
      id: user.id,
      mikrotik_synced: false,
    };
    if (newPassword.trim()) {
      updates.password_hash = newPassword;
    }
    if (newUsername.trim()) {
      updates.username = newUsername;
    }
    await updateUser.mutateAsync(updates as { id: string; password_hash?: string; username?: string; mikrotik_synced: boolean });
    setPasswordDialogOpen(false);
    setNewPassword('');
    setNewUsername('');
  };

  const handleChangePlan = async () => {
    if (!user || !selectedPlanId) return;
    const plan = filteredPlans.find(p => p.id === selectedPlanId);
    if (!plan) return;
    
    await updateUser.mutateAsync({
      id: user.id,
      plan_id: selectedPlanId,
      monthly_bill: plan.price,
      mikrotik_synced: false,
    });
    
    setPlanDialogOpen(false);
    setSelectedPlanId('');
  };

  const handleSendSms = async () => {
    if (!user?.phone || !smsMessage.trim()) return;
    setIsSendingSms(true);
    try {
      const success = await sendSms({ phone: user.phone, message: smsMessage.trim() });
      if (success) {
        toast.success('SMS sent successfully!');
        setSmsDialogOpen(false);
        setSmsMessage('');
      } else {
        toast.error('Failed to send SMS. Check SMS gateway settings.');
      }
    } catch {
      toast.error('Failed to send SMS');
    } finally {
      setIsSendingSms(false);
    }
  };

  if (usersLoading) {
    return (
      <DashboardLayout title="User Profile" subtitle="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout title="User Not Found" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">The requested user could not be found.</p>
          <Button onClick={() => navigate('/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Profile" subtitle={user.username}>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
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
          {user.phone && (
            <Button
              variant="outline"
              onClick={() => setSmsDialogOpen(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send SMS
            </Button>
          )}
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
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
            {/* Live Bandwidth Monitoring */}
            <BandwidthLiveChart 
              userId={user.id} 
              username={user.username}
              serviceType={user.service_type}
              routerId={user.mikrotik_router_id}
            />
            
            {/* Historical Bandwidth Usage */}
            <BandwidthHistoryChart 
              userId={user.id}
              username={user.username}
            />
            
            {/* Static Data Usage Details */}
            <DataUsageTab user={user} />
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogTab userId={user.id} lastLoginAt={user.last_login_at} username={user.username} />
        </TabsContent>
      </Tabs>

      {/* Recharge Dialog */}
      <RechargeDialog
        user={user}
        open={rechargeDialogOpen}
        onOpenChange={setRechargeDialogOpen}
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
              disabled={updateUser.isPending || (!newPassword.trim() && !newUsername.trim())}
            >
              {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
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
              <Label>Select New Plan ({user.service_type?.toUpperCase()})</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {filteredPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ৳{Number(plan.price).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPlanId && (() => {
              const selectedPlan = filteredPlans.find(p => p.id === selectedPlanId);
              return (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">New Plan Price:</span>
                    <span className="font-semibold text-foreground">৳{Number(selectedPlan?.price || 0).toLocaleString()}/month</span>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={handleChangePlan}
              disabled={updateUser.isPending || !selectedPlanId}
            >
              {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
      />

      {/* Grace Activation Dialog */}
      {user.status === 'expired' && (
        <GraceActivationDialog
          open={graceDialogOpen}
          onOpenChange={setGraceDialogOpen}
          user={{
            id: user.id,
            username: user.username,
            grace_days_used: user.grace_days_used || 0,
          }}
        />
      )}

      {/* Send SMS Dialog */}
      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Send SMS to {user.full_name || user.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <p className="text-sm font-mono text-muted-foreground">{user.phone || 'No phone number'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                placeholder="Type your message here..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="bg-secondary border-border min-h-[120px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{smsMessage.length}/500</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={handleSendSms}
              disabled={isSendingSms || !smsMessage.trim() || !user.phone}
            >
              {isSendingSms ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send SMS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
