import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Reseller {
  id: string;
  name: string;
  code: string | null;
  balance: number;
  commission_rate: number | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_super_admin?: boolean;
}

interface ResellerAuthContextType {
  reseller: Reseller | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (loginUserId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshReseller: () => Promise<void>;
}

const ResellerAuthContext = createContext<ResellerAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'reseller_session';
const TOKEN_KEY = 'reseller_session_token';

export function ResellerAuthProvider({ children }: { children: ReactNode }) {
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const storedSession = localStorage.getItem(STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedSession && storedToken) {
      try {
        const parsed = JSON.parse(storedSession);
        // Validate session token server-side
        validateSession(storedToken, parsed);
      } catch (e) {
        clearSession();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateSession = async (token: string, cachedReseller: Reseller) => {
    try {
      const { data, error } = await supabase.functions.invoke('reseller-auth', {
        body: { action: 'validate_session', session_token: token },
      });

      if (error || !data?.success) {
        clearSession();
        return;
      }

      setReseller(cachedReseller);
      setSessionToken(token);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    setReseller(null);
    setSessionToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setIsLoading(false);
  };

  const login = async (loginUserId: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('reseller-auth', {
        body: { action: 'login', login_user_id: loginUserId, password },
      });

      if (error) {
        return { success: false, error: 'Authentication failed' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const resellerData = {
        ...data.reseller,
        is_super_admin: data.is_super_admin || false,
      };

      setReseller(resellerData);
      setSessionToken(data.session_token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resellerData));
      localStorage.setItem(TOKEN_KEY, data.session_token);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await supabase.functions.invoke('reseller-auth', {
          body: { action: 'logout', session_token: sessionToken },
        });
      } catch {
        // Ignore logout errors
      }
    }
    clearSession();
  };

  const refreshReseller = async () => {
    if (!reseller || !sessionToken) return;
    
    // Validate session is still valid, then fetch fresh data
    const { data: validData } = await supabase.functions.invoke('reseller-auth', {
      body: { action: 'validate_session', session_token: sessionToken },
    });

    if (!validData?.success) {
      clearSession();
      return;
    }

    if (reseller.id !== 'super_admin') {
      // Fetch fresh reseller data via edge function
      const { data, error } = await supabase.functions.invoke('reseller-get-stats', {
        body: { resellerId: reseller.id, isSuperAdmin: false, session_token: sessionToken },
      });

      // Just re-validate, keep existing data if stats call works
      if (!error && data?.success) {
        // Stats fetched successfully, session is valid
      }
    }
  };

  return (
    <ResellerAuthContext.Provider value={{ reseller, sessionToken, isLoading, login, logout, refreshReseller }}>
      {children}
    </ResellerAuthContext.Provider>
  );
}

export function useResellerAuth() {
  const context = useContext(ResellerAuthContext);
  if (context === undefined) {
    throw new Error('useResellerAuth must be used within a ResellerAuthProvider');
  }
  return context;
}
