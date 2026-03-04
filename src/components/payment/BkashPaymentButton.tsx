import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBkashPayment } from '@/hooks/useBkashPayment';
import { Loader2, Wallet } from 'lucide-react';

interface BkashPaymentButtonProps {
  userId: string;
  userName?: string;
  defaultAmount?: number;
  onSuccess?: (newBalance: number) => void;
}

export function BkashPaymentButton({ userId, userName, defaultAmount, onSuccess }: BkashPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : '');
  const { createPayment, isLoading } = useBkashPayment();

  const quickAmounts = [100, 200, 500, 1000];

  const handlePayment = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      return;
    }

    const result = await createPayment({
      amount: numAmount,
      userId,
      description: `Top-up for ${userName || 'user'}`,
    });

    if (result.success && result.bkashURL) {
      // Redirect to bKash payment page
      window.location.href = result.bkashURL;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E2136E] hover:bg-[#C11160] text-white gap-2">
          <Wallet className="h-4 w-4" />
          Pay with bKash
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#E2136E] flex items-center justify-center">
              <span className="text-white font-bold text-sm">b</span>
            </div>
            bKash Payment
          </DialogTitle>
          <DialogDescription>
            Enter the amount to add to your account balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (BDT)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                min={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                >
                  ৳{preset}
                </Button>
              ))}
            </div>
          </div>

          <Button
            className="w-full bg-[#E2136E] hover:bg-[#C11160] text-white"
            onClick={handlePayment}
            disabled={isLoading || !amount || parseFloat(amount) < 10}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay ৳{amount || '0'}</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Minimum amount: ৳10 • Secured by bKash
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}