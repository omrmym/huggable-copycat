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
    // Validate auth
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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { api_url, api_key, sender_id, number, message } = body;

    if (!api_key || !number || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: api_key, number, message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the BulkSMSBD API URL
    // Always use the correct smsapi endpoint - extract only host from user-provided URL
    let baseUrl = 'http://bulksmsbd.net/api/smsapi';
    if (api_url) {
      try {
        const parsed = new URL(api_url);
        // Use only the host from user config, always force /api/smsapi path
        baseUrl = `${parsed.protocol}//${parsed.host}/api/smsapi`;
      } catch {
        // If URL parsing fails, use default
      }
    }
    
    const params = new URLSearchParams({
      api_key: api_key,
      type: 'text',
      number: number,
      senderid: sender_id || '',
      message: message,
    });

    const smsUrl = `${baseUrl}?${params.toString()}`;

    console.log(`Sending SMS to ${number} via ${baseUrl}`);

    const smsResponse = await fetch(smsUrl, {
      method: 'GET',
    });

    const responseText = await smsResponse.text();
    console.log(`SMS API Response: ${responseText}`);

    // Try to parse as JSON
    let responseData: Record<string, unknown>;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw_response: responseText };
    }

    // Check for BulkSMSBD success code (202 = success)
    const statusCode = responseData?.response_code || responseData?.status_code || responseData?.error_code;
    const isSuccess = statusCode === 202;

    return new Response(JSON.stringify({
      success: isSuccess,
      status_code: statusCode,
      message: isSuccess ? 'SMS sent successfully' : 'SMS sending failed',
      api_response: responseData,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SMS sending error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send SMS',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
