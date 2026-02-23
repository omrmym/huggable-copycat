import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LoginActivity {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  action: 'sign_in' | 'sign_out' | 'sign_in_failed';
  ip_address: string | null;
  user_agent: string | null;
  login_method: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export function useLoginActivity(limit = 50) {
  return useQuery({
    queryKey: ['login-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as LoginActivity[];
    },
  });
}

export function useClearLoginActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('login_activity')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login-activity'] });
    },
  });
}

export async function logLoginActivity(params: {
  userId: string;
  userEmail: string;
  userName?: string;
  action: 'sign_in' | 'sign_out' | 'sign_in_failed';
  loginMethod?: string;
  success?: boolean;
  errorMessage?: string;
}) {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
  
  const { error } = await supabase.from('login_activity').insert({
    user_id: params.userId,
    user_email: params.userEmail,
    user_name: params.userName || null,
    action: params.action,
    user_agent: userAgent,
    login_method: params.loginMethod || null,
    success: params.success ?? true,
    error_message: params.errorMessage || null,
  });

  if (error) {
    console.error('Failed to log login activity:', error);
  }
}

// Log failed login attempts via secure edge function (no auth required)
export async function logFailedLoginAttempt(params: {
  email: string;
  loginMethod?: string;
  errorMessage?: string;
}) {
  try {
    const response = await supabase.functions.invoke('log-failed-login', {
      body: {
        email: params.email,
        loginMethod: params.loginMethod || 'email',
        errorMessage: params.errorMessage || 'Authentication failed',
      },
    });

    if (response.error) {
      console.error('Failed to log failed login attempt:', response.error);
    }
  } catch (err) {
    console.error('Error calling log-failed-login function:', err);
  }
}
