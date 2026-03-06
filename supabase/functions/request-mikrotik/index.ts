import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getRestPort(port: number, useSsl: boolean): number {
  if (port === 8728) return 80;
  if (port === 8729) return 443;
  return port;
}

async function mikrotikRequest(
  host: string, port: number, useSsl: boolean, username: string, password: string,
  path: string, method: string = "GET", body?: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const restPort = getRestPort(port, useSsl);
  const protocol = useSsl || restPort === 443 ? "https" : "http";
  const portSuffix = (protocol === "http" && restPort === 80) || (protocol === "https" && restPort === 443) ? "" : `:${restPort}`;
  const url = `${protocol}://${host}${portSuffix}/rest${path}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${username}:${password}`) },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `MikroTik API error: ${response.status} - ${text}` };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, username, password, mikrotik_router_id, profile } = body;

    // Get router config
    let routerQuery = supabase.from("mikrotik_routers").select("*").eq("is_active", true);
    if (mikrotik_router_id) {
      routerQuery = routerQuery.eq("id", mikrotik_router_id);
    }
    const { data: routers } = await routerQuery.limit(1);

    if (!routers || routers.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No router found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const router = routers[0];
    let result: { success: boolean; data?: unknown; error?: string };

    switch (action) {
      case "create-disabled": {
        // Create user in MikroTik as disabled
        const existing = await mikrotikRequest(router.host, router.port, router.use_ssl, router.username, router.password, `/ip/hotspot/user?=name=${username}`);
        if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
          // Already exists, disable it
          const userId = (existing.data[0] as Record<string, string>)[".id"];
          const patchBody: Record<string, unknown> = { disabled: "yes" };
          if (profile) patchBody.profile = profile;
          result = await mikrotikRequest(router.host, router.port, router.use_ssl, router.username, router.password, `/ip/hotspot/user/${userId}`, "PATCH", patchBody);
        } else {
          // Create new disabled user
          const createBody: Record<string, unknown> = {
            name: username,
            password: password,
            disabled: "yes",
          };
          if (profile) createBody.profile = profile;
          result = await mikrotikRequest(router.host, router.port, router.use_ssl, router.username, router.password, "/ip/hotspot/user/add", "POST", createBody);
        }
        break;
      }

      case "cleanup-expired": {
        // Find requests older than 48 hours
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: expiredRequests } = await supabase
          .from("user_requests")
          .select("*")
          .eq("status", "pending")
          .lt("created_at", cutoff);

        const deleted: string[] = [];
        for (const req of expiredRequests || []) {
          // Delete from MikroTik
          const existing = await mikrotikRequest(router.host, router.port, router.use_ssl, router.username, router.password, `/ip/hotspot/user?=name=${req.mikrotik_username}`);
          if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
            const userId = (existing.data[0] as Record<string, string>)[".id"];
            await mikrotikRequest(router.host, router.port, router.use_ssl, router.username, router.password, `/ip/hotspot/user/${userId}`, "DELETE");
          }
          // Delete request from DB
          await supabase.from("user_requests").delete().eq("id", req.id);
          deleted.push(req.mikrotik_username);
        }
        result = { success: true, data: { deleted_count: deleted.length, deleted_users: deleted } };
        break;
      }

      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('Request mikrotik error:', err);
    return new Response(JSON.stringify({ success: false, error: 'An error occurred processing your request' }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
