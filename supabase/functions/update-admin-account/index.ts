import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify the caller
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is super_admin
    const { data: softwareUser } = await adminClient
      .from("software_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (softwareUser?.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Only super admins can use this" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, new_email, current_password, new_password } = body;

    if (action === "update_email") {
      if (!new_email) {
        return new Response(JSON.stringify({ error: "New email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update email via admin API (no confirmation needed)
      const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
        email: new_email,
        email_confirm: true,
      });
      if (updateError) throw updateError;

      // Update software_users table
      const { error: dbError } = await adminClient
        .from("software_users")
        .update({ email: new_email })
        .eq("user_id", user.id);
      if (dbError) throw dbError;

      return new Response(JSON.stringify({ success: true, message: "Email updated successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_password") {
      if (!current_password || !new_password) {
        return new Response(JSON.stringify({ error: "Current and new password are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify current password
      const { error: signInError } = await adminClient.auth.signInWithPassword({
        email: user.email!,
        password: current_password,
      });
      if (signInError) {
        return new Response(JSON.stringify({ error: "Current password is incorrect" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update password via admin API
      const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
        password: new_password,
      });
      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true, message: "Password updated successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Update admin account error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
