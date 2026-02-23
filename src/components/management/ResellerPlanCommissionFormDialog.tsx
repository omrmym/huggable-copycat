import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateResellerPlanCommission, useUpdateResellerPlanCommission, ResellerPlanCommission } from '@/hooks/useResellerPlanCommissions';
import { useResellers } from '@/hooks/useResellers';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { Loader2 } from 'lucide-react';

interface ResellerPlanCommissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: ResellerPlanCommission | null;
}

export function ResellerPlanCommissionFormDialog({ open, onOpenChange, commission }: ResellerPlanCommissionFormDialogProps) {
  const { data: resellers } = useResellers();
  const { data: plans } = useBillingPlans();
  const createCommission = useCreateResellerPlanCommission();
  const updateCommission = useUpdateResellerPlanCommission();
  
  const [formData, setFormData] = useState({
    reseller_id: '',
    plan_id: '',
    commission_rate: 0,
    is_active: true,
  });

  useEffect(() => {
    if (commission) {
      setFormData({
        reseller_id: commission.reseller_id,
        plan_id: commission.plan_id,
        commission_rate: commission.commission_rate,
        is_active: commission.is_active,
      });
    } else {
      setFormData({
        reseller_id: '',
        plan_id: '',
        commission_rate: 0,
        is_active: true,
      });
    }
  }, [commission, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      reseller_id: formData.reseller_id,
      plan_id: formData.plan_id,
      commission_rate: formData.commission_rate,
      is_active: formData.is_active,
    };

    if (commission) {
      await updateCommission.mutateAsync({ id: commission.id, ...payload });
    } else {
      await createCommission.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isLoading = createCommission.isPending || updateCommission.isPending;
  const selectedPlan = plans?.find(p => p.id === formData.plan_id);
  const commissionAmount = selectedPlan ? (selectedPlan.price * formData.commission_rate) / 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{commission ? 'Edit Commission Rate' : 'Add Commission Rate'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reseller_id">Reseller *</Label>
            <Select
              value={formData.reseller_id}
              onValueChange={(value) => setFormData({ ...formData, reseller_id: value })}
              required
              disabled={!!commission}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reseller" />
              </SelectTrigger>
              <SelectContent>
                {resellers?.filter(r => r.is_active).map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan_id">Plan *</Label>
            <Select
              value={formData.plan_id}
              onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
              required
              disabled={!!commission}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans?.filter(p => p.is_active && p.service_type === 'pppoe').map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ৳{plan.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
            <Input
              id="commission_rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.commission_rate}
              onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
              required
            />
            {selectedPlan && (
              <p className="text-sm text-muted-foreground">
                Commission amount: ৳{commissionAmount.toLocaleString()} per recharge
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.reseller_id || !formData.plan_id}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {commission ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
