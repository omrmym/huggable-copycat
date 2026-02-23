import { format as dateFnsFormat, formatDistanceToNow as dateFnsFormatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

// Default timezone offset in hours (UTC+6 for Bangladesh)
let cachedTimezoneOffsetHours = 6;

// Fetch timezone from app_settings
async function fetchTimezoneOffset(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'timezone')
      .maybeSingle();

    if (error || !data) {
      return 6; // Default to UTC+6
    }

    const settings = data.value as { timezone_offset_hours?: number };
    return settings.timezone_offset_hours ?? 6;
  } catch {
    return 6; // Default to UTC+6 on error
  }
}

// Initialize timezone on module load
fetchTimezoneOffset().then((offset) => {
  cachedTimezoneOffsetHours = offset;
});

// Function to refresh the cached timezone (call after settings update)
export async function refreshTimezoneCache(): Promise<void> {
  cachedTimezoneOffsetHours = await fetchTimezoneOffset();
}

// Get the current timezone offset in hours
export function getTimezoneOffsetHours(): number {
  return cachedTimezoneOffsetHours;
}

// Set timezone offset manually (for immediate updates without refetch)
export function setTimezoneOffsetHours(hours: number): void {
  cachedTimezoneOffsetHours = hours;
}

/**
 * Converts a date to the configured timezone
 */
export function toTimezone(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const offsetMinutes = cachedTimezoneOffsetHours * 60;
  // Get the UTC time in milliseconds, then add the timezone offset
  const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utcTime + (offsetMinutes * 60000));
}

/**
 * Formats a date in the configured timezone
 */
export function formatDate(date: Date | string, formatStr: string): string {
  return dateFnsFormat(toTimezone(date), formatStr);
}

/**
 * Formats distance to now from the configured timezone
 */
export function formatDistanceToNowTz(date: Date | string, options?: { addSuffix?: boolean }): string {
  return dateFnsFormatDistanceToNow(toTimezone(date), options);
}

/**
 * Gets current date in the configured timezone
 */
export function getNow(): Date {
  return toTimezone(new Date());
}

/**
 * Formats a date for display (common format: MMM d, yyyy HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'MMM d, yyyy HH:mm');
}

/**
 * Formats a date for display (short format: MMM d, h:mm a)
 */
export function formatDateTimeShort(date: Date | string): string {
  return formatDate(date, 'MMM d, h:mm a');
}

/**
 * Formats a date only (format: MMM d, yyyy)
 */
export function formatDateOnly(date: Date | string): string {
  return formatDate(date, 'MMM d, yyyy');
}

/**
 * Formats a date only (format: dd/MM/yyyy)
 */
export function formatDateSlash(date: Date | string): string {
  return formatDate(date, 'dd/MM/yyyy');
}
