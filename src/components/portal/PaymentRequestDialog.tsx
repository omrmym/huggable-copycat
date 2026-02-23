import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';

interface PaymentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentBalance: number;
}

export function PaymentRequestDialog({
  open,
  onOpenChange,
  userId,
  userName,
  currentBalance,
}: PaymentRequestDialogProps) {
  const queryClient = useQueryClient();
  const { data: plans = [] } = useBillingPlans();
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const createPaymentRequest = useMutation({
    mutationFn: async () => {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const selectedPlan = plans.find(p => p.id === selectedPlanId);

      // Create a pending transaction
      const { error } = await supabase.from('transactions').insert({
        radius_user_id: userId,
        amount: amountNum,
        type: 'payment',
        status: 'pending',
        description: `Payment request${selectedPlan ? ` for ${selectedPlan.name}` : ''}${notes ? ` - ${notes}` : ''}`,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-transactions', userId] });
      toast.success('Payment request submitted! Please wait for admin approval.');
      onOpenChange(false);
      setSelectedPlanId('');
      setAmount('');
      setNotes('');
    },
    onError: (error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setAmount(plan.price.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPaymentRequest.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Request Payment</DialogTitle>
          <DialogDescription>
            Submit a payment request to add balance to your account. 
            An administrator will review and approve your request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Balance</Label>
            <p className={`text-lg font-mono ${currentBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
              ৳{currentBalance.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Select Plan (Optional)</Label>
            <Select value={selectedPlanId} onValueChange={handlePlanSelect}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select a plan to auto-fill amount" />
              </SelectTrigger>
              <SelectContent>
                {plans.filter(p => p.is_active).map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ৳{plan.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (৳)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary border-border"
              min="1"
              step="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes for the admin..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary border-border"
              rows={3}
            />
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="p-3 bg-secondary rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Balance (after approval)</span>
                <span className="font-mono text-primary">
                  ৳{(currentBalance + parseFloat(amount)).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-primary-foreground"
              disabled={createPaymentRequest.isPending || !amount || parseFloat(amount) <= 0}
            >
              {createPaymentRequest.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
