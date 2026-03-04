import { mockUsers, mockPlans, mockTransactions } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Network,
  Wifi,
  ArrowDown,
  ArrowUp,
  Calendar,
  CreditCard,
  History,
  User,
  LogOut,
  Check,
} from 'lucide-react';
import { BkashPaymentButton } from '@/components/payment/BkashPaymentButton';

export default function CustomerPortal() {
  // Simulated logged-in user
  const currentUser = mockUsers[0];
  const currentPlan = mockPlans.find((p) => p.id === currentUser.planId);
  const userTransactions = mockTransactions.filter((t) => t.userId === currentUser.id);

  const dataUsagePercent = currentUser.dataLimit
    ? (currentUser.dataUsed / currentUser.dataLimit) * 100
    : null;

  const formatDataSize = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  const daysUntilExpiry = currentUser.expiresAt
    ? Math.ceil(
        (new Date(currentUser.expiresAt).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

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
            <div className="text-right">
              <p className="font-medium text-foreground">{currentUser.fullName}</p>
              <p className="text-sm text-muted-foreground font-mono">
                {currentUser.username}
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome back, {currentUser.fullName.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground">
            Manage your account, view usage, and renew your subscription.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan Card */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="bg-gradient-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm">
                      Current Plan
                    </p>
                    <h3 className="text-2xl font-bold text-primary-foreground">
                      {currentPlan?.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-foreground/80 text-sm">Monthly</p>
                    <p className="text-2xl font-bold text-primary-foreground">
                      ৳{currentPlan?.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <ArrowDown className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">
                      {currentPlan?.speedLimit.download}
                    </p>
                    <p className="text-sm text-muted-foreground">Mbps Down</p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <ArrowUp className="w-5 h-5 text-success mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">
                      {currentPlan?.speedLimit.upload}
                    </p>
                    <p className="text-sm text-muted-foreground">Mbps Up</p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <Calendar className="w-5 h-5 text-warning mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">
                      {daysUntilExpiry}
                    </p>
                    <p className="text-sm text-muted-foreground">Days Left</p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <Wifi className="w-5 h-5 text-online mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground capitalize">
                      {currentUser.status}
                    </p>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Usage */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Data Usage This Month</CardTitle>
                <CardDescription>
                  {currentPlan?.dataLimit
                    ? 'Your monthly data allocation'
                    : 'You have unlimited data'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-bold text-foreground">
                        {formatDataSize(currentUser.dataUsed)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentPlan?.dataLimit
                          ? `of ${formatDataSize(currentPlan.dataLimit)}`
                          : 'used this month'}
                      </p>
                    </div>
                    {dataUsagePercent !== null && (
                      <p className="text-lg font-semibold text-primary">
                        {dataUsagePercent.toFixed(0)}%
                      </p>
                    )}
                  </div>
                  {dataUsagePercent !== null && (
                    <Progress value={dataUsagePercent} className="h-3" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userTransactions.length > 0 ? (
                    userTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {tx.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-foreground">
                          ৳{tx.amount.toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No transactions yet
                    </p>
                  )}
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
                  <BkashPaymentButton 
                    userId={currentUser.id} 
                    userName={currentUser.fullName}
                  />
                  <Button variant="outline" className="w-full border-border">
                    Renew Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-border"
                >
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-border"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-border"
                >
                  <History className="w-4 h-4 mr-2" />
                  View Invoices
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>Contact our support team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Phone: <span className="text-foreground">+63 123 456 7890</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Email:{' '}
                  <span className="text-foreground">support@mikrobill.com</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
