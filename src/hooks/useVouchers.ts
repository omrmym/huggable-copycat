import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Voucher = Tables<'vouchers'> & {
  plan?: Tables<'billing_plans'> | null;
};

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useVouchers() {
  return useQuery({
    queryKey: ['vouchers'],
    queryFn: async (): Promise<Voucher[]> => {
      const { data, error } = await supabase
        .from('vouchers')
        .select(`
          *,
          plan:billing_plans(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useGenerateVouchers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, count }: { planId: string; count: number }) => {
      const vouchers: TablesInsert<'vouchers'>[] = [];

      for (let i = 0; i < count; i++) {
        vouchers.push({
          code: generateVoucherCode(),
          plan_id: planId,
          status: 'unused',
        });
      }

      const { data, error } = await supabase
        .from('vouchers')
        .insert(vouchers)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success(`Generated ${data?.length || 0} vouchers successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate vouchers: ${error.message}`);
    },
  });
}

export function useActivateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, userId }: { code: string; userId?: string }) => {
      // Find the voucher
      const { data: voucher, error: findError } = await supabase
        .from('vouchers')
        .select(`*, plan:billing_plans(*)`)
        .eq('code', code.toUpperCase())
        .single();

      if (findError || !voucher) {
        throw new Error('Voucher not found');
      }

      if (voucher.status !== 'unused') {
        throw new Error(`Voucher is ${voucher.status}`);
      }

      // Calculate expiration based on plan duration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (voucher.plan?.duration_days || 1));

      // Update voucher status
      const { error: updateError } = await supabase
        .from('vouchers')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          used_by: userId || null,
        })
        .eq('id', voucher.id);

      if (updateError) throw updateError;

      return { voucher, expiresAt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Voucher activated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to activate voucher: ${error.message}`);
    },
  });
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Voucher deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete voucher: ${error.message}`);
    },
  });
}