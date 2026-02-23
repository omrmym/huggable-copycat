import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ResellerCredit {
  id: string;
  reseller_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string | null;
  balance_after: number;
  payment_method: string | null;
  created_by: string | null;
  created_at: string;
  resellers?: { name: string; balance: number } | null;
}

export function useResellerCredits(resellerId?: string) {
  return useQuery({
    queryKey: ['reseller-credits', resellerId],
    queryFn: async () => {
      let query = supabase
        .from('reseller_credits')
        .select('*, resellers(name, balance)')
        .order('created_at', { ascending: false });
      
      if (resellerId) {
        query = query.eq('reseller_id', resellerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ResellerCredit[];
    },
  });
}

export function useTransferCredit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reseller_id, amount, description, payment_method }: { reseller_id: string; amount: number; description?: string; payment_method?: string }) => {
      // First get current balance
      const { data: reseller, error: fetchError } = await supabase
        .from('resellers')
        .select('balance')
        .eq('id', reseller_id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newBalance = (reseller?.balance || 0) + amount;
      
      // Update reseller balance
      const { error: updateError } = await supabase
        .from('resellers')
        .update({ balance: newBalance })
        .eq('id', reseller_id);
      
      if (updateError) throw updateError;
      
      // Create credit record
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('reseller_credits')
        .insert({
          reseller_id,
          amount,
          type: 'credit',
          description: description || 'Credit transfer',
          balance_after: newBalance,
          payment_method: payment_method || null,
          created_by: user.user?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-credits'] });
      queryClient.invalidateQueries({ queryKey: ['resellers'] });
      toast({ title: 'Success', description: 'Credit transferred successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
