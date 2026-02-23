import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useVouchers, useGenerateVouchers, useDeleteVoucher } from '@/hooks/useVouchers';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Search,
  Plus,
  Printer,
  Download,
  Copy,
  Ticket,
  Check,
  X,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig = {
  unused: {
    label: 'Unused',
    icon: Ticket,
    className: 'bg-primary/20 text-primary border-primary/30',
  },
  active: {
    label: 'Active',
    icon: Check,
    className: 'bg-success/20 text-success border-success/30',
  },
  expired: {
    label: 'Expired',
    icon: Clock,
    className: 'bg-warning/20 text-warning border-warning/30',
  },
  used: {
    label: 'Used',
    icon: X,
    className: 'bg-muted text-muted-foreground border-muted',
  },
};

export default function VouchersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [generateCount, setGenerateCount] = useState('10');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: vouchers = [], isLoading } = useVouchers();
  const { data: plans = [] } = useBillingPlans();
  const generateVouchers = useGenerateVouchers();

  const hotspotPlans = plans.filter((p) => p.type === 'voucher');

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch = voucher.code
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || voucher.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPlanName = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.name || 'Unknown';
  };

  const getPlanPrice = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.price || 0;
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Voucher code copied!');
  };

  const handleGenerateVouchers = async () => {
    if (!selectedPlan) return;
    
    await generateVouchers.mutateAsync({
      planId: selectedPlan,
      count: parseInt(generateCount) || 10,
    });
    
    setIsDialogOpen(false);
    setSelectedPlan('');
    setGenerateCount('10');
  };

  const voucherStats = {
    total: vouchers.length,
    unused: vouchers.filter((v) => v.status === 'unused').length,
    active: vouchers.filter((v) => v.status === 'active').length,
    expired: vouchers.filter((v) => v.status === 'expired').length,
  };

  return (
    <DashboardLayout title="Recharge" subtitle="Generate and manage hotspot vouchers">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription>Total Vouchers</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? <Skeleton className="h-8 w-16" /> : voucherStats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription>Unused</CardDescription>
            <CardTitle className="text-2xl text-primary">
              {isLoading ? <Skeleton className="h-8 w-16" /> : voucherStats.unused}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-success">
              {isLoading ? <Skeleton className="h-8 w-16" /> : voucherStats.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription>Expired</CardDescription>
            <CardTitle className="text-2xl text-warning">
              {isLoading ? <Skeleton className="h-8 w-16" /> : voucherStats.expired}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search voucher codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-card border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unused">Unused</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="used">Used</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-border">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" className="border-border">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Generate Vouchers</DialogTitle>
                <DialogDescription>
                  Create a batch of hotspot voucher codes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotspotPlans.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No voucher plans available
                        </SelectItem>
                      ) : (
                        hotspotPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ৳{plan.price}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Vouchers</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    This will generate{' '}
                    <span className="font-semibold text-foreground">
                      {generateCount}
                    </span>{' '}
                    voucher codes
                    {selectedPlan && (
                      <>
                        {' '}
                        worth{' '}
                        <span className="font-semibold text-foreground">
                          ৳{getPlanPrice(selectedPlan) * parseInt(generateCount || '0')}
                        </span>{' '}
                        total
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-border" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-primary text-primary-foreground"
                  onClick={handleGenerateVouchers}
                  disabled={generateVouchers.isPending || !selectedPlan}
                >
                  {generateVouchers.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Vouchers
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vouchers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-20 mb-4" />
                <Skeleton className="h-8 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVouchers.map((voucher) => {
            const statusKey = voucher.status as keyof typeof statusConfig;
            const status = statusConfig[statusKey] || statusConfig.unused;
            const StatusIcon = status.icon;

            return (
              <Card
                key={voucher.id}
                className="bg-card border-border hover:border-primary/30 transition-colors"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                        status.className
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(voucher.code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-xl font-mono font-bold text-foreground tracking-wider mb-2">
                    {voucher.code}
                  </p>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Plan:{' '}
                      <span className="text-foreground">
                        {getPlanName(voucher.plan_id)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Price:{' '}
                      <span className="text-foreground">
                        ৳{getPlanPrice(voucher.plan_id)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Created:{' '}
                      <span className="text-foreground">
                        {new Date(voucher.created_at).toLocaleDateString()}
                      </span>
                    </p>
                    {voucher.expires_at && (
                      <p className="text-muted-foreground">
                        Expires:{' '}
                        <span className="text-foreground">
                          {new Date(voucher.expires_at).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filteredVouchers.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No vouchers found</h3>
          <p className="text-muted-foreground">
            Generate new vouchers or adjust your filters.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}