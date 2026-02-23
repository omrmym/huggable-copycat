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

    // Check if admin already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const adminExists = existingUsers?.users?.some(u => u.email === 'admin@radiusbill.com')

    if (adminExists) {
      return new Response(
        JSON.stringify({ success: true, message: 'Admin user already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user via Auth Admin API (proper password hashing)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@radiusbill.com',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: { full_name: 'System Admin' }
    })

    if (createError) {
      return new Response(
        JSON.stringify({ success: false, error: createError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Add to admin_users table
    await supabase.from('admin_users').insert({
      user_id: newUser.user.id,
      full_name: 'System Admin'
    })

    // Add to software_users table for User ID login
    await supabase.from('software_users').insert({
      user_id: newUser.user.id,
      email: 'admin@radiusbill.com',
      full_name: 'System Admin',
      login_user_id: 'admin',
      role: 'super_admin',
      is_active: true
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Admin user created', userId: newUser.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
