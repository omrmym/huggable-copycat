import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get SMS gateway config from app_settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'sms_gateway')
      .maybeSingle();

    if (settingsError || !settings?.value) {
      return new Response(JSON.stringify({ error: 'SMS gateway not configured', balance: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = settings.value as Record<string, unknown>;
    const api_key = config.api_key as string;
    const api_url = config.api_url as string;

    if (!api_key) {
      return new Response(JSON.stringify({ error: 'SMS API key not configured', balance: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build balance API URL
    let balanceUrl = 'http://bulksmsbd.net/api/getBalanceApi';
    if (api_url) {
      try {
        const parsed = new URL(api_url);
        balanceUrl = `${parsed.protocol}//${parsed.host}/api/getBalanceApi`;
      } catch {
        // Use default
      }
    }

    // Call BulkSMSBD balance API (POST with form data)
    const formData = new FormData();
    formData.append('api_key', api_key);

    const balanceResponse = await fetch(balanceUrl, {
      method: 'POST',
      body: formData,
    });

    const responseText = await balanceResponse.text();
    console.log(`SMS Balance API Response: ${responseText}`);

    let responseData: Record<string, unknown>;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw_response: responseText };
    }

    return new Response(JSON.stringify({
      success: true,
      balance: responseData?.balance ?? responseData?.raw_response ?? null,
      api_response: responseData,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SMS balance check error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to check SMS balance',
      balance: null,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
