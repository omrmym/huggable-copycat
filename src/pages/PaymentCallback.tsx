import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBkashPayment } from '@/hooks/useBkashPayment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { executePayment, isLoading } = useBkashPayment();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('');
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const handleCallback = async () => {
      const paymentID = searchParams.get('paymentID');
      const bkashStatus = searchParams.get('status');

      // Get stored payment info
      const storedPayment = sessionStorage.getItem('bkash_payment');

      if (!storedPayment) {
        setStatus('failed');
        setMessage('Payment session expired. Please try again.');
        return;
      }

      const { userId, amount } = JSON.parse(storedPayment);

      if (bkashStatus === 'success' && paymentID) {
        const result = await executePayment(paymentID, userId, amount);

        if (result.success) {
          setStatus('success');
          setMessage('Your payment was successful!');
          setNewBalance(result.newBalance || null);
          sessionStorage.removeItem('bkash_payment');
        } else {
          setStatus('failed');
          setMessage(result.error || 'Payment execution failed');
        }
      } else if (bkashStatus === 'cancel') {
        setStatus('failed');
        setMessage('Payment was cancelled');
        sessionStorage.removeItem('bkash_payment');
      } else {
        setStatus('failed');
        setMessage('Payment failed. Please try again.');
        sessionStorage.removeItem('bkash_payment');
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'processing' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-success" />
            )}
            {status === 'failed' && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle>
            {status === 'processing' && 'Processing Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'success' && newBalance !== null && (
            <div className="bg-success/10 text-success rounded-lg p-4">
              <p className="text-sm">New Balance</p>
              <p className="text-2xl font-bold">৳{newBalance.toLocaleString()}</p>
            </div>
          )}

          <div className="flex gap-2 justify-center pt-4">
            <Button variant="outline" onClick={() => navigate('/portal')}>
              Go to Portal
            </Button>
            {status === 'failed' && (
              <Button onClick={() => navigate('/portal')}>
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}