import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, username, password } = body;

    if (action === "login") {
      if (!username || !password) {
        return new Response(
          JSON.stringify({ success: false, error: "Username and password are required" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Look up user by username
      const { data: user, error: userError } = await supabase
        .from("radius_users")
        .select("id, username, full_name, phone, email, status, plan_id, service_type, expires_at, data_used_mb, mikrotik_router_id, monthly_bill, password_hash")
        .eq("username", username)
        .maybeSingle();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid username or password" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check password (stored as plain text in password_hash field)
      if (user.password_hash !== password) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid username or password" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return user data without password
      const { password_hash: _, ...userData } = user;
      return new Response(
        JSON.stringify({ success: true, user: userData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error('Customer auth error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
