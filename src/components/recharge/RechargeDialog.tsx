import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useRechargeUser } from '@/hooks/useRadiusUsers';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, User, Loader2, CalendarIcon, CreditCard, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type RadiusUser = Tables<'radius_users'> & {
  plan?: Tables<'billing_plans'> | null;
};

interface RechargeDialogProps {
  user: RadiusUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RechargeDialog({ user, open, onOpenChange }: RechargeDialogProps) {
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeDescription, setRechargeDescription] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [rechargeDate, setRechargeDate] = useState<Date>(new Date());

  const { data: paymentMethods = [] } = usePaymentMethods();
  const rechargeUser = useRechargeUser();
  const { user: authUser } = useAuth();

  // Get current plan price
  const currentPlanPrice = user?.plan?.price || 0;

  // Check if DUE is selected
  const isDuePayment = useMemo(() => {
    const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
    return method?.code === 'DUE' || method?.name.toUpperCase() === 'DUE';
  }, [paymentMethods, selectedPaymentMethod]);

  // Validation
  const isValid = useMemo(() => {
    const hasAmount = rechargeAmount && parseFloat(rechargeAmount) > 0;
    const hasPaymentMethod = !!selectedPaymentMethod;
    const hasDescriptionForDue = !isDuePayment || (isDuePayment && rechargeDescription.trim());
    return hasAmount && hasPaymentMethod && hasDescriptionForDue;
  }, [rechargeAmount, selectedPaymentMethod, isDuePayment, rechargeDescription]);

  // Reset form when dialog opens with a new user - auto-fill with current plan price
  useEffect(() => {
    if (open && user) {
      setRechargeAmount(currentPlanPrice > 0 ? currentPlanPrice.toString() : '');
      setRechargeDescription('');
      setSelectedPaymentMethod('');
      setRechargeDate(new Date());
    }
  }, [open, user, currentPlanPrice]);

  const handleRecharge = async () => {
    if (!user || !isValid) return;

    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) return;

    const paymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    const collectedBy = authUser?.user_metadata?.full_name || authUser?.email || 'Unknown';

    await rechargeUser.mutateAsync({
      userId: user.id,
      amount,
      description: rechargeDescription || undefined,
      paymentMethod: paymentMethod?.name,
      collectedBy,
    });

    onOpenChange(false);
  };

  if (!user) return null;

  const currentBalance = user.balance || 0;
  const newBalance = currentBalance + (parseFloat(rechargeAmount) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-primary" />
            Recharge Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Customer Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {user.full_name || user.username}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>@{user.username}</span>
                  {user.phone && <span>• {user.phone}</span>}
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs uppercase">
                    {user.service_type}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-lg font-bold text-foreground">৳{currentBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                Payment Method *
              </Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recharge Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                Recharge Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-secondary border-border",
                      !rechargeDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rechargeDate ? format(rechargeDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={rechargeDate}
                    onSelect={(date) => date && setRechargeDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount (৳) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Description - Full Width */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Description {isDuePayment && <span className="text-destructive">* (Required for DUE)</span>}
              </Label>
              <Input
                placeholder={isDuePayment ? "Enter description (required for DUE payment)" : "e.g., Monthly payment"}
                value={rechargeDescription}
                onChange={(e) => setRechargeDescription(e.target.value)}
                className={cn(
                  "bg-secondary border-border",
                  isDuePayment && !rechargeDescription.trim() && "border-destructive"
                )}
              />
              {isDuePayment && !rechargeDescription.trim() && (
                <p className="text-xs text-destructive">Description is required when payment method is DUE</p>
              )}
            </div>
          </div>

          {/* New Balance Preview */}
          {parseFloat(rechargeAmount) > 0 && (
            <div className="flex justify-between items-center p-4 bg-success/10 rounded-lg border border-success/30">
              <span className="text-success font-medium">New Balance After Recharge</span>
              <span className="text-xl font-bold text-success">
                ৳{newBalance.toLocaleString()}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-border"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-primary text-primary-foreground"
              onClick={handleRecharge}
              disabled={rechargeUser.isPending || !isValid}
            >
              {rechargeUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Recharge ৳{parseFloat(rechargeAmount || '0').toLocaleString()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
