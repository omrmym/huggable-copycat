import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logLoginActivity, logFailedLoginAttempt } from '@/hooks/useLoginActivity';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, loginMethod?: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to prevent potential deadlocks
          setTimeout(async () => {
            const adminStatus = await checkAdminStatus(session.user.id);
            setIsAdmin(adminStatus);
            setIsLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const adminStatus = await checkAdminStatus(session.user.id);
        setIsAdmin(adminStatus);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, loginMethod: string = 'email') => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      // Log failed login attempt via secure edge function
      await logFailedLoginAttempt({
        email,
        loginMethod,
        errorMessage: error.message,
      });
      return { error: error as Error };
    }

    // Log successful login
    if (data.user) {
      const userName = data.user.user_metadata?.full_name || null;
      await logLoginActivity({
        userId: data.user.id,
        userEmail: email,
        userName,
        action: 'sign_in',
        loginMethod,
        success: true,
      });
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName }
      }
    });

    if (error) return { error: error as Error };

    // Add user to admin_users table after signup
    if (data.user) {
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({ user_id: data.user.id, full_name: fullName });
      
      if (adminError) {
        console.error('Error adding admin user:', adminError);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    // Log sign out before clearing user
    if (user) {
      await logLoginActivity({
        userId: user.id,
        userEmail: user.email || 'unknown',
        userName: user.user_metadata?.full_name || null,
        action: 'sign_out',
        success: true,
      });
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
