import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useBillingPlans, useCreateBillingPlan, useDeleteBillingPlan, useUpdateBillingPlan } from '@/hooks/useBillingPlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Wifi,
  Network,
  ArrowDown,
  ArrowUp,
  Edit,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';

type BillingPlan = Tables<'billing_plans'>;

export default function PlansPage() {
  const { data: plans = [], isLoading } = useBillingPlans();
  const createPlan = useCreateBillingPlan();
  const deletePlan = useDeleteBillingPlan();
  const updatePlan = useUpdateBillingPlan();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    service_type: '' as 'pppoe' | 'hotspot' | '',
    type: '' as 'monthly' | 'voucher' | '',
    download_speed: '',
    upload_speed: '',
    data_limit: '',
    duration: '30',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      service_type: '',
      type: '',
      download_speed: '',
      upload_speed: '',
      data_limit: '',
      duration: '30',
      is_active: true,
    });
    setEditingPlan(null);
  };

  const openEditDialog = (plan: BillingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      service_type: plan.service_type as '' | 'hotspot' | 'pppoe',
      type: plan.type as '' | 'monthly' | 'voucher',
      download_speed: (plan.download_speed_kbps / 1000).toString(),
      upload_speed: (plan.upload_speed_kbps / 1000).toString(),
      data_limit: plan.data_limit_mb?.toString() || '',
      duration: plan.duration_days.toString(),
      is_active: plan.is_active,
    });
    setIsDialogOpen(true);
  };

  const hotspotPlans = plans.filter((p) => p.service_type === 'hotspot');
  const pppoePlans = plans.filter((p) => p.service_type === 'pppoe');

  const formatDataLimit = (limit: number | null) => {
    if (limit === null) return 'Unlimited';
    if (limit >= 1024) return `${(limit / 1024).toFixed(0)} GB`;
    return `${limit} MB`;
  };

  const handleSavePlan = async () => {
    if (!formData.name || !formData.service_type || !formData.type) return;

    const planData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price) || 0,
      service_type: formData.service_type,
      type: formData.type,
      download_speed_kbps: (parseFloat(formData.download_speed) || 10) * 1000,
      upload_speed_kbps: (parseFloat(formData.upload_speed) || 5) * 1000,
      data_limit_mb: formData.data_limit ? parseInt(formData.data_limit) : null,
      duration_days: parseInt(formData.duration) || 30,
      is_active: formData.is_active,
    };

    if (editingPlan) {
      await updatePlan.mutateAsync({ id: editingPlan.id, ...planData });
    } else {
      await createPlan.mutateAsync(planData);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      await deletePlan.mutateAsync(id);
    }
  };

  const handleToggleActive = async (plan: BillingPlan) => {
    await updatePlan.mutateAsync({
      id: plan.id,
      is_active: !plan.is_active,
    });
  };

  const PlanCard = ({ plan }: { plan: BillingPlan }) => (
    <Card
      className={cn(
        'bg-card border-border hover:border-primary/30 transition-all group relative overflow-hidden',
        !plan.is_active && 'opacity-60'
      )}
    >
      {!plan.is_active && (
        <div className="absolute top-2 right-2 bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
          Inactive
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          {plan.service_type === 'hotspot' ? (
            <Wifi className="w-5 h-5 text-primary" />
          ) : (
            <Network className="w-5 h-5 text-primary" />
          )}
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              plan.type === 'voucher'
                ? 'bg-warning/20 text-warning'
                : 'bg-success/20 text-success'
            )}
          >
            {plan.type === 'voucher' ? 'Voucher' : 'Monthly'}
          </span>
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-4">
          ৳{plan.price.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">
            /{plan.type === 'voucher' ? `${plan.duration_days}d` : 'mo'}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <ArrowDown className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Download:{' '}
              <span className="text-foreground font-medium">
                {(plan.download_speed_kbps / 1000).toFixed(0)} Mbps
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ArrowUp className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">
              Upload:{' '}
              <span className="text-foreground font-medium">
                {(plan.upload_speed_kbps / 1000).toFixed(0)} Mbps
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Data:{' '}
              <span className="text-foreground font-medium">
                {formatDataLimit(plan.data_limit_mb)}
              </span>
            </span>
          </div>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-border"
            onClick={() => handleToggleActive(plan)}
          >
            {plan.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/50 text-primary hover:bg-primary/10"
            onClick={() => openEditDialog(plan)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => handleDeletePlan(plan.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const PlanSkeleton = () => (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-24 mb-4" />
        <div className="space-y-3 mb-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Plans" subtitle="Configure billing plans and packages">
      <Tabs defaultValue="pppoe" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="pppoe" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Network className="w-4 h-4 mr-2" />
              PPPoE Plans
            </TabsTrigger>
            <TabsTrigger value="hotspot" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Wifi className="w-4 h-4 mr-2" />
              Hotspot Plans
            </TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                <DialogDescription>
                  {editingPlan ? 'Update the billing plan details.' : 'Add a new billing plan for your customers.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plan Name *</Label>
                    <Input 
                      placeholder="e.g. Home Fiber 50" 
                      className="bg-secondary border-border"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (৳) *</Label>
                    <Input 
                      type="number" 
                      placeholder="999" 
                      className="bg-secondary border-border"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    placeholder="Brief description" 
                    className="bg-secondary border-border"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Type *</Label>
                    <Select
                      value={formData.service_type}
                      onValueChange={(value: 'pppoe' | 'hotspot') => setFormData({ ...formData, service_type: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pppoe">PPPoE</SelectItem>
                        <SelectItem value="hotspot">Hotspot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Plan Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'monthly' | 'voucher') => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="voucher">Voucher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Download Speed (Mbps)</Label>
                    <Input 
                      type="number" 
                      placeholder="20" 
                      className="bg-secondary border-border"
                      value={formData.download_speed}
                      onChange={(e) => setFormData({ ...formData, download_speed: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Speed (Mbps)</Label>
                    <Input 
                      type="number" 
                      placeholder="10" 
                      className="bg-secondary border-border"
                      value={formData.upload_speed}
                      onChange={(e) => setFormData({ ...formData, upload_speed: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Limit (MB)</Label>
                    <Input 
                      type="number" 
                      placeholder="Leave empty for unlimited" 
                      className="bg-secondary border-border"
                      value={formData.data_limit}
                      onChange={(e) => setFormData({ ...formData, data_limit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (days)</Label>
                    <Input 
                      type="number" 
                      placeholder="30" 
                      className="bg-secondary border-border"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">Plan is available for new subscriptions</p>
                  </div>
                  <Switch 
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-border" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-primary text-primary-foreground"
                  onClick={handleSavePlan}
                  disabled={(editingPlan ? updatePlan.isPending : createPlan.isPending) || !formData.name || !formData.service_type || !formData.type}
                >
                  {(editingPlan ? updatePlan.isPending : createPlan.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="pppoe">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <PlanSkeleton key={i} />)
            ) : pppoePlans.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No PPPoE plans yet. Create one to get started.
              </div>
            ) : (
              pppoePlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="hotspot">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <PlanSkeleton key={i} />)
            ) : hotspotPlans.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No Hotspot plans yet. Create one to get started.
              </div>
            ) : (
              hotspotPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}