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
import { Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface NagadPaymentButtonProps {
  userId: string;
  userName?: string;
  onSuccess?: (newBalance: number) => void;
}

export function NagadPaymentButton({ userId, userName, onSuccess }: NagadPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickAmounts = [100, 200, 500, 1000];

  const handlePayment = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      return;
    }

    setIsLoading(true);
    // Nagad integration placeholder - requires API keys
    toast.info('Nagad payment integration is being configured. Please contact your ISP administrator.');
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#F6921E] hover:bg-[#E07D10] text-white gap-2 w-full">
          <Wallet className="h-4 w-4" />
          Pay with Nagad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#F6921E] flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            Nagad Payment
          </DialogTitle>
          <DialogDescription>
            Enter the amount to add to your account balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nagad-amount">Amount (BDT)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
              <Input
                id="nagad-amount"
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
            className="w-full bg-[#F6921E] hover:bg-[#E07D10] text-white"
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
            Minimum amount: ৳10 • Secured by Nagad
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
