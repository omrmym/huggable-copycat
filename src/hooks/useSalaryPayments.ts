import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SalaryPayment {
  id: string;
  employee_id: string;
  payment_date: string;
  base_salary: number;
  bonus: number | null;
  deductions: number | null;
  net_salary: number;
  payment_method: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    full_name: string;
    employee_id: string;
    department: string | null;
    salary: number | null;
  };
}

export type SalaryPaymentInsert = Omit<SalaryPayment, 'id' | 'created_at' | 'updated_at' | 'employee'>;
export type SalaryPaymentUpdate = Partial<SalaryPaymentInsert>;

export function useSalaryPayments() {
  return useQuery({
    queryKey: ['salary_payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salary_payments')
        .select(`
          *,
          employee:employees(id, full_name, employee_id, department, salary)
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as SalaryPayment[];
    },
  });
}

export function useCreateSalaryPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payment: SalaryPaymentInsert) => {
      const { data, error } = await supabase
        .from('salary_payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary_payments'] });
      toast({
        title: 'Payment Created',
        description: 'The salary payment has been recorded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateSalaryPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & SalaryPaymentUpdate) => {
      const { data, error } = await supabase
        .from('salary_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary_payments'] });
      toast({
        title: 'Payment Updated',
        description: 'The salary payment has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteSalaryPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('salary_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary_payments'] });
      toast({
        title: 'Payment Deleted',
        description: 'The salary payment has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('salary_payments')
        .update({ status: 'paid' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary_payments'] });
      toast({
        title: 'Payment Marked as Paid',
        description: 'The salary payment has been marked as paid.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
