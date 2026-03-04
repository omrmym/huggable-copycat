import { supabase } from '@/integrations/supabase/client';

interface SendSmsParams {
  phone: string;
  message: string;
  /** Optional: check if this automation type is enabled before sending */
  automationType?: 'bill_reminder' | 'payment_confirmation' | 'expiry_warning' | 'service_activation';
  /** Optional: name of the recipient for history */
  recipientName?: string;
  /** Optional: radius_user_id for linking */
  radiusUserId?: string;
}

export async function sendSms({ phone, message, automationType, recipientName, radiusUserId }: SendSmsParams): Promise<boolean> {
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

    // Map automation type to SMS type label
    const smsTypeMap: Record<string, string> = {
      bill_reminder: 'Bill Reminder',
      payment_confirmation: 'Payment Confirmation',
      expiry_warning: 'Expiry Warning',
      service_activation: 'Service Activation',
    };
    const smsType = automationType ? smsTypeMap[automationType] || 'Custom' : 'Custom';

    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        api_url,
        api_key,
        sender_id,
        number: phone,
        message,
      },
    });

    const success = !error && data?.success === true;

    // Get current user for sent_by
    const { data: userData } = await supabase.auth.getUser();

    // Save to sms_history
    await supabase.from('sms_history' as any).insert({
      recipient_phone: phone,
      recipient_name: recipientName || null,
      message,
      sms_type: smsType,
      status: success ? 'delivered' : 'failed',
      api_response: data || null,
      radius_user_id: radiusUserId || null,
      sent_by: userData?.user?.id || null,
    } as any);

    if (error) {
      console.warn('SMS send error:', error);
      return false;
    }

    return success;
  } catch (err) {
    console.warn('SMS send failed:', err);
    return false;
  }
}
