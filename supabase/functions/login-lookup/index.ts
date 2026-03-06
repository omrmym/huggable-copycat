import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { login_user_id } = await req.json()

    if (!login_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Login User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check software_users first
    const { data: softwareUser, error: softwareError } = await supabase
      .from('software_users')
      .select('email, is_active')
      .eq('login_user_id', login_user_id)
      .maybeSingle()

    if (softwareUser && softwareUser.is_active) {
      return new Response(
        JSON.stringify({ success: true, email: softwareUser.email }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Return generic error for all failure cases to prevent enumeration
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid credentials' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    )

  } catch (error) {
    console.error('Login lookup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing your request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
