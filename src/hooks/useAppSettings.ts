import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface SessionTimeoutSettings {
  timeout_minutes: number;
  warning_minutes: number;
}

export interface TimezoneSettings {
  timezone_offset_hours: number;
  timezone_label: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: Json;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useSessionTimeoutSettings() {
  return useQuery({
    queryKey: ['app-settings', 'session_timeout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'session_timeout')
        .single();

      if (error) throw error;
      
      const value = data.value as unknown as SessionTimeoutSettings;
      return value;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useUpdateSessionTimeoutSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SessionTimeoutSettings) => {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ value: settings as unknown as Json })
        .eq('key', 'session_timeout')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'session_timeout'] });
      toast.success('Session timeout settings updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });
}

// Timezone Settings Hooks
export function useTimezoneSettings() {
  return useQuery({
    queryKey: ['app-settings', 'timezone'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'timezone')
        .maybeSingle();

      if (error) throw error;
      
      // Return default if not set
      if (!data) {
        return {
          timezone_offset_hours: 6,
          timezone_label: 'UTC+06:00 (Dhaka, Bangladesh)',
        } as TimezoneSettings;
      }
      
      const value = data.value as unknown as TimezoneSettings;
      return value;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useUpdateTimezoneSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: TimezoneSettings) => {
      // Check if timezone setting exists
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'timezone')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('app_settings')
          .update({ value: settings as unknown as Json })
          .eq('key', 'timezone')
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('app_settings')
          .insert({
            key: 'timezone',
            value: settings as unknown as Json,
            description: 'Application timezone settings',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'timezone'] });
      toast.success('Timezone settings updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update timezone: ${error.message}`);
    },
  });
}

// Helper to get timezone offset for use in utilities
export function useTimezoneOffset() {
  const { data } = useTimezoneSettings();
  return data?.timezone_offset_hours ?? 6; // Default to UTC+6
}

// Expiration Time Settings
export interface ExpirationTimeConfig {
  hour: number;
  minute: number;
}

export function useExpirationTimeSettings() {
  return useQuery({
    queryKey: ['app-settings', 'default_expiration_time'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'default_expiration_time')
        .maybeSingle();

      if (error) throw error;
      if (!data) return { hour: 9, minute: 0 } as ExpirationTimeConfig;
      return data.value as unknown as ExpirationTimeConfig;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateExpirationTimeSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: ExpirationTimeConfig) => {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'default_expiration_time')
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('app_settings')
          .update({ value: settings as unknown as Json })
          .eq('key', 'default_expiration_time')
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('app_settings')
          .insert({
            key: 'default_expiration_time',
            value: settings as unknown as Json,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'default_expiration_time'] });
      toast.success('Default expiration time saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });
}
