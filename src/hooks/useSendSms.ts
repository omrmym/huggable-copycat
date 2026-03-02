import { supabase } from '@/integrations/supabase/client';

interface SendSmsParams {
  phone: string;
  message: string;
  /** Optional: check if this automation type is enabled before sending */
  automationType?: 'bill_reminder' | 'payment_confirmation' | 'expiry_warning' | 'service_activation';
}

export async function sendSms({ phone, message, automationType }: SendSmsParams): Promise<boolean> {
  try {
    // Fetch SMS gateway config
    const { data: settings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'sms_gateway')
      .maybeSingle();

    if (!settings?.value) return false;

    const config = settings.value as Record<string, unknown>;
    const api_key = config.api_key as string;
    const api_url = config.api_url as string;
    const sender_id = config.sender_id as string;

    if (!api_key) return false;

    // Check if the automation type is enabled
    if (automationType && config[automationType] === false) {
      return false;
    }

    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        api_url,
        api_key,
        sender_id,
        number: phone,
        message,
      },
    });

    if (error) {
      console.warn('SMS send error:', error);
      return false;
    }

    return data?.success === true;
  } catch (err) {
    console.warn('SMS send failed:', err);
    return false;
  }
}
