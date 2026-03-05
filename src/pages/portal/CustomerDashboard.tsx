import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { useUserTransactions } from '@/hooks/useTransactions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserBandwidth } from '@/hooks/useUserBandwidth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { UserStatusBadge } from '@/components/dashboard/UserStatusBadge';
import { BkashPaymentButton } from '@/components/payment/BkashPaymentButton';
import { NagadPaymentButton } from '@/components/payment/NagadPaymentButton';
import { PaymentRequestDialog } from '@/components/portal/PaymentRequestDialog';
import { CustomerActivityLog } from '@/components/portal/CustomerActivityLog';
import {
  Network,
  LogOut,
  User,
  CreditCard,
  History,
  HardDrive,
  Activity,
  Wifi,
  Calendar,
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  MessageSquare,
} from 'lucide-react';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { customer, logout, isLoading, refreshCustomer } = useCustomerAuth();
  const { data: plans = [] } = useBillingPlans();
  const { data: transactions = [], isLoading: transactionsLoading } = useUserTransactions(customer?.id);
  const { data: bandwidthData } = useUserBandwidth(
    customer?.id,
    customer?.username,
    customer?.service_type,
    customer?.mikrotik_router_id
  );
  const { data: paymentConfig } = useQuery({
    queryKey: ['payment-gateway-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'payment_gateway')
        .maybeSingle();
      return (data?.value as Record<string, any>) || {};
    },
  });

  const bkashEnabled = paymentConfig?.bkash_enabled === true;
  const nagadEnabled = paymentConfig?.nagad_enabled === true;

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    navigate('/portal/login');
    return null;
  }

  const currentPlan = plans.find((p) => p.id === customer.plan_id);
  
  const daysUntilExpiry = customer.expires_at
    ? Math.ceil(
        (new Date(customer.expires_at).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const formatDataSize = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  const formatSpeed = (bps: number) => {
    const mbps = bps / 1024 / 1024;
    if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`;
    const kbps = bps / 1024;
    return `${kbps.toFixed(0)} Kbps`;
  };

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Network className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">MikroBill</h1>
              <p className="text-xs text-muted-foreground">Customer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-foreground">{customer.full_name || customer.username}</p>
              <p className="text-sm text-muted-foreground font-mono">@{customer.username}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome & Status */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Welcome, {(customer.full_name || customer.username).split(' ')[0]}!
            </h2>
            <div className="flex items-center gap-2">
              <UserStatusBadge status={customer.status} />
              {bandwidthData?.isOnline && (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              )}
            </div>
          </div>
          <Button 
            onClick={() => refreshCustomer()} 
            variant="outline" 
            size="sm"
            className="border-border"
          >
            Refresh Data
          </Button>
        </div>

        {/* Account Alert for expired/disabled */}
        {customer.status === 'expired' && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Account Attention Required</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.status === 'expired' 
                      ? 'Your subscription has expired. Please recharge to continue using the service.'
                      : 'Your account needs attention.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span className="hidden sm:inline">Data Usage</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Current Plan */}
                <Card className="bg-card border-border overflow-hidden">
                  <div className="bg-gradient-primary p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-primary-foreground/80 text-sm">Current Plan</p>
                        <h3 className="text-2xl font-bold text-primary-foreground">
                          {currentPlan?.name || 'No Plan'}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-primary-foreground/80 text-sm">Monthly Bill</p>
                        <p className="text-2xl font-bold text-primary-foreground">
                          ৳{(customer.monthly_bill ?? currentPlan?.price ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-secondary rounded-lg">
                        <ArrowDown className="w-5 h-5 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {currentPlan ? (currentPlan.download_speed_kbps / 1024).toFixed(0) : '-'}
                        </p>
                        <p className="text-sm text-muted-foreground">Mbps Down</p>
                      </div>
                      <div className="text-center p-4 bg-secondary rounded-lg">
                        <ArrowUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {currentPlan ? (currentPlan.upload_speed_kbps / 1024).toFixed(0) : '-'}
                        </p>
                        <p className="text-sm text-muted-foreground">Mbps Up</p>
                      </div>
                      <div className="text-center p-4 bg-secondary rounded-lg">
                        <Calendar className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {daysUntilExpiry !== null ? daysUntilExpiry : '-'}
                        </p>
                        <p className="text-sm text-muted-foreground">Days Left</p>
                      </div>
                      <div className="text-center p-4 bg-secondary rounded-lg">
                        <Wifi className="w-5 h-5 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground capitalize">
                          {bandwidthData?.isOnline ? 'Online' : 'Offline'}
                        </p>
                        <p className="text-sm text-muted-foreground">Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Info */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Username</span>
                          <span className="font-mono text-foreground">{customer.username}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Full Name</span>
                          <span className="text-foreground">{customer.full_name || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="text-foreground">{customer.phone || '-'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Email</span>
                          <span className="text-foreground">{customer.email || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Service Type</span>
                          <span className="text-foreground capitalize">{customer.service_type}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Expires</span>
                          <span className="text-foreground">
                            {customer.expires_at 
                              ? new Date(customer.expires_at).toLocaleDateString() 
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {bkashEnabled && (
                        <BkashPaymentButton
                          userId={customer.id}
                          userName={customer.full_name || customer.username}
                          defaultAmount={customer.monthly_bill ?? undefined}
                        />
                      )}
                      {nagadEnabled && (
                        <NagadPaymentButton
                          userId={customer.id}
                          userName={customer.full_name || customer.username}
                          defaultAmount={customer.monthly_bill ?? undefined}
                        />
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full border-border"
                        onClick={() => setPaymentDialogOpen(true)}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Request Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Stats */}
                {bandwidthData?.isOnline && (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="w-5 h-5 text-green-500" />
                        Live Session
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uptime</span>
                        <span className="text-foreground font-mono">{bandwidthData.uptime || '-'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <ArrowDown className="w-3 h-3 text-primary" /> Download
                        </span>
                        <span className="text-foreground">{formatSpeed(bandwidthData.bytesIn)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <ArrowUp className="w-3 h-3 text-green-500" /> Upload
                        </span>
                        <span className="text-foreground">{formatSpeed(bandwidthData.bytesOut)}</span>
                      </div>
                      {bandwidthData.address && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">IP Address</span>
                          <span className="text-foreground font-mono">{bandwidthData.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Support */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                    <CardDescription>Contact our support team</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Phone: <span className="text-foreground">+880 1XXX-XXXXXX</span>
                    </p>
                    <p className="text-muted-foreground">
                      Email: <span className="text-foreground">support@mikrobill.com</span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Transaction History
                </CardTitle>
                <CardDescription>All your payments and account activities</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.status === 'completed' 
                              ? 'bg-green-500/20' 
                              : tx.status === 'pending'
                              ? 'bg-yellow-500/20'
                              : 'bg-destructive/20'
                          }`}>
                            {tx.status === 'completed' ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : tx.status === 'pending' ? (
                              <Clock className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{tx.description || tx.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString()} • {tx.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">৳{tx.amount.toLocaleString()}</p>
                          <Badge variant="outline" className="text-xs capitalize">{tx.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Usage Tab */}
          <TabsContent value="usage">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Data Usage This Month</CardTitle>
                  <CardDescription>
                    {currentPlan?.data_limit_mb 
                      ? 'Your monthly data allocation'
                      : 'You have unlimited data'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-4xl font-bold text-foreground">
                          {formatDataSize(customer.data_used_mb)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentPlan?.data_limit_mb
                            ? `of ${formatDataSize(currentPlan.data_limit_mb)}`
                            : 'used this month'}
                        </p>
                      </div>
                      {currentPlan?.data_limit_mb && (
                        <p className="text-lg font-semibold text-primary">
                          {((customer.data_used_mb / currentPlan.data_limit_mb) * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                    {currentPlan?.data_limit_mb && (
                      <Progress 
                        value={(customer.data_used_mb / currentPlan.data_limit_mb) * 100} 
                        className="h-3" 
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Current Session</CardTitle>
                  <CardDescription>Real-time connection statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  {bandwidthData?.isOnline ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary rounded-lg text-center">
                          <ArrowDown className="w-6 h-6 text-primary mx-auto mb-2" />
                          <p className="text-xl font-bold text-foreground">
                            {formatDataSize(bandwidthData.bytesIn / 1024 / 1024)}
                          </p>
                          <p className="text-sm text-muted-foreground">Downloaded</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg text-center">
                          <ArrowUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                          <p className="text-xl font-bold text-foreground">
                            {formatDataSize(bandwidthData.bytesOut / 1024 / 1024)}
                          </p>
                          <p className="text-sm text-muted-foreground">Uploaded</p>
                        </div>
                      </div>
                      <div className="p-4 bg-secondary rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Session Duration</span>
                          <span className="font-mono text-foreground">{bandwidthData.uptime || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wifi className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">You are currently offline</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Connect to see real-time statistics
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <CustomerActivityLog userId={customer.id} username={customer.username} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Request Dialog */}
      <PaymentRequestDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        userId={customer.id}
        userName={customer.full_name || customer.username}
        currentBalance={0}
      />
    </div>
  );
}
