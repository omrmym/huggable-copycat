import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTransferCredit } from '@/hooks/useResellerCredits';
import { useResellers } from '@/hooks/useResellers';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { Loader2 } from 'lucide-react';

interface CreditTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditTransferDialog({ open, onOpenChange }: CreditTransferDialogProps) {
  const { data: resellers } = useResellers();
  const { data: paymentMethods } = usePaymentMethods();
  const transferCredit = useTransferCredit();
  
  const [formData, setFormData] = useState({
    reseller_id: '',
    amount: 0,
    payment_method: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await transferCredit.mutateAsync({
      reseller_id: formData.reseller_id,
      amount: formData.amount,
      payment_method: formData.payment_method || undefined,
      description: formData.description || undefined,
    });
    
    setFormData({ reseller_id: '', amount: 0, payment_method: '', description: '' });
    onOpenChange(false);
  };

  const selectedReseller = resellers?.find(r => r.id === formData.reseller_id);
  const newBalance = (selectedReseller?.balance || 0) + formData.amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Credit to Reseller</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reseller_id">Reseller *</Label>
            <Select
              value={formData.reseller_id}
              onValueChange={(value) => setFormData({ ...formData, reseller_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reseller" />
              </SelectTrigger>
              <SelectContent>
                {resellers?.filter(r => r.is_active).map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.name} (Balance: ৳{reseller.balance?.toLocaleString() || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (৳) *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />
            {selectedReseller && formData.amount > 0 && (
              <p className="text-sm text-muted-foreground">
                New balance will be: ৳{newBalance.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods?.filter(pm => pm.is_active).map((method) => (
                  <SelectItem key={method.id} value={method.name}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Monthly credit allocation"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={transferCredit.isPending || !formData.reseller_id || formData.amount <= 0 || !formData.payment_method}>
              {transferCredit.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Transfer Credit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
