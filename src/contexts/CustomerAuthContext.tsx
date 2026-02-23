import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomerUser {
  id: string;
  username: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  balance: number;
  status: 'active' | 'disabled' | 'expired' | 'suspended';
  plan_id: string | null;
  service_type: 'hotspot' | 'pppoe';
  expires_at: string | null;
  data_used_mb: number;
  mikrotik_router_id: string | null;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
  autoLogin: (userData: CustomerUser) => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const CUSTOMER_SESSION_KEY = 'customer_session';

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        // Validate session (check if it's still valid)
        refreshCustomerData(parsed.id).then((data) => {
          if (data) {
            setCustomer(data);
          } else {
            localStorage.removeItem(CUSTOMER_SESSION_KEY);
          }
          setIsLoading(false);
        });
      } catch {
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshCustomerData = async (userId: string): Promise<CustomerUser | null> => {
    const { data, error } = await supabase.functions.invoke('customer-auto-login', {
      body: { userId },
    });
    if (error || !data?.success) return null;
    return data.user as CustomerUser;
  };

  const refreshCustomer = async () => {
    if (!customer) return;
    const data = await refreshCustomerData(customer.id);
    if (data) {
      setCustomer(data);
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ id: data.id }));
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Call edge function to validate credentials
      const { data, error } = await supabase.functions.invoke('customer-auth', {
        body: { action: 'login', username, password },
      });

      if (error) {
        return { success: false, error: 'Authentication failed. Please try again.' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Invalid username or password' };
      }

      // Use full customer data returned from edge function
      const customerData = data.user as CustomerUser;
      setCustomer(customerData);
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ id: customerData.id }));
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  };

  const autoLogin = (userData: CustomerUser) => {
    setCustomer(userData);
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ id: userData.id }));
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, isLoading, login, logout, refreshCustomer, autoLogin }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
