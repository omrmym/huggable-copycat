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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBkashPayment } from '@/hooks/useBkashPayment';
import { Loader2, Wallet, CreditCard } from 'lucide-react';

interface ResellerBkashRechargeProps {
  resellerId: string;
  resellerName: string;
  currentBalance: number;
}

export function ResellerBkashRecharge({ resellerId, resellerName, currentBalance }: ResellerBkashRechargeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const { createPayment, isLoading } = useBkashPayment();

  const quickAmounts = [500, 1000, 2000, 5000];

  const handlePayment = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      return;
    }

    // Store reseller info for callback handling
    sessionStorage.setItem('reseller_bkash_recharge', JSON.stringify({
      resellerId,
      resellerName,
      amount: numAmount,
    }));

    const result = await createPayment({
      amount: numAmount,
      userId: resellerId,
      description: `Credit recharge for reseller: ${resellerName}`,
    });

    if (result.success && result.bkashURL) {
      window.location.href = result.bkashURL;
    }
  };

  return (
    <Card className="border-[#E2136E]/20 bg-gradient-to-br from-[#E2136E]/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#E2136E] flex items-center justify-center">
              <span className="text-white font-bold text-lg">b</span>
            </div>
            <div>
              <CardTitle className="text-lg">bKash Credit Recharge</CardTitle>
              <CardDescription>Add credits to your account using bKash</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold text-primary">৳{currentBalance.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-[#E2136E] hover:bg-[#C11160] text-white gap-2">
              <Wallet className="h-4 w-4" />
              Recharge via bKash
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#E2136E] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">b</span>
                </div>
                bKash Credit Recharge
              </DialogTitle>
              <DialogDescription>
                Enter the amount to add to your reseller credit balance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reseller</p>
                  <p className="font-medium">{resellerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="font-semibold text-primary">৳{currentBalance.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Recharge Amount (BDT)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8"
                    min={100}
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

              {amount && parseFloat(amount) >= 100 && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Recharge Amount</span>
                    <span>৳{parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>New Balance</span>
                    <span className="text-success">৳{(currentBalance + parseFloat(amount)).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-[#E2136E] hover:bg-[#C11160] text-white"
                onClick={handlePayment}
                disabled={isLoading || !amount || parseFloat(amount) < 100}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ৳{amount || '0'} via bKash
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Minimum amount: ৳100 • Secured by bKash
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
