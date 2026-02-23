import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreatePaymentParams {
  amount: number;
  userId: string;
  description?: string;
}

interface PaymentResult {
  success: boolean;
  paymentID?: string;
  bkashURL?: string;
  invoiceNumber?: string;
  error?: string;
}

interface ExecuteResult {
  success: boolean;
  transactionId?: string;
  amount?: string;
  newBalance?: number;
  error?: string;
}

export function useBkashPayment() {
  const [isLoading, setIsLoading] = useState(false);

  const createPayment = async (params: CreatePaymentParams): Promise<PaymentResult> => {
    setIsLoading(true);
    try {
      const callbackURL = `${window.location.origin}/payment/callback`;
      
      const { data, error } = await supabase.functions.invoke('bkash-payment', {
        body: {
          action: 'create',
          amount: params.amount,
          userId: params.userId,
          description: params.description,
          callbackURL,
        },
      });

      if (error) throw error;

      if (data.success && data.bkashURL) {
        // Store payment info in session storage for callback handling
        sessionStorage.setItem('bkash_payment', JSON.stringify({
          paymentID: data.paymentID,
          userId: params.userId,
          amount: params.amount,
        }));
        
        return data;
      } else {
        throw new Error(data.error || 'Payment creation failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const executePayment = async (paymentID: string, userId: string, amount: number): Promise<ExecuteResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bkash-payment', {
        body: {
          action: 'execute',
          paymentID,
          userId,
          amount,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Payment successful! New balance: ৳${data.newBalance}`);
        return data;
      } else {
        throw new Error(data.error || 'Payment execution failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute payment');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const queryPayment = async (paymentID: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bkash-payment', {
        body: {
          action: 'query',
          paymentID,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to query payment');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPayment,
    executePayment,
    queryPayment,
    isLoading,
  };
}