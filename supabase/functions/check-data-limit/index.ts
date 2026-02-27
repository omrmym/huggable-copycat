import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RouterConfig {
  host: string;
  port: string | number;
  username: string;
  password: string;
  connectionMode?: "api" | "rest";
  useSsl?: boolean;
}

function getConfiguredPort(router: RouterConfig): number {
  const parsed = typeof router.port === "string" ? parseInt(router.port, 10) : router.port;
  return Number.isFinite(parsed) ? parsed : 8728;
}

function getRestPort(router: RouterConfig): number {
  const port = getConfiguredPort(router);
  if (port === 8728) return 80;
  if (port === 8729) return 443;
  return port;
}

function getProtocol(router: RouterConfig, port: number): "http" | "https" {
  return router.useSsl || port === 443 ? "https" : "http";
}

function buildMikrotikUrl(router: RouterConfig, path: string, port: number, useRestPrefix: boolean): string {
  const protocol = getProtocol(router, port);
  const portSuffix = (protocol === "http" && port === 80) || (protocol === "https" && port === 443) ? "" : `:${port}`;
  const prefix = useRestPrefix ? "/rest" : "";
  return `${protocol}://${router.host}${portSuffix}${prefix}${path}`;
}

async function mikrotikRestRequest(
  router: RouterConfig,
  path: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const configuredPort = getConfiguredPort(router);
  const mappedRestPort = getRestPort(router);

  const variants = [
    { port: mappedRestPort, useRestPrefix: true },
    { port: configuredPort, useRestPrefix: true },
    { port: mappedRestPort, useRestPrefix: false },
    { port: configuredPort, useRestPrefix: false },
  ];

  const deduped = variants.filter((v, idx, arr) =>
    arr.findIndex((x) => x.port === v.port && x.useRestPrefix === v.useRestPrefix) === idx
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: "Basic " + btoa(`${router.username}:${router.password}`),
  };

  for (const variant of deduped) {
    const url = buildMikrotikUrl(router, path, variant.port, variant.useRestPrefix);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await response.text();
      if (response.ok) {
        if (!text || text.trim() === "") return { success: true, data: {} };
        try { return { success: true, data: JSON.parse(text) }; } catch { return { success: true, data: { raw: text } }; }
      }
      if (response.status !== 404) return { success: false, error: `${response.status} - ${text}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("abort")) continue;
    }
  }
  return { success: false, error: "MikroTik REST API unavailable" };
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
    const { userId } = body;

    // If userId provided, check single user. Otherwise check all active users with data limits.
    let usersToCheck: Array<{
      id: string;
      username: string;
      data_used_mb: number;
      status: string;
      mikrotik_router_id: string | null;
      plan_id: string | null;
    }> = [];

    if (userId) {
      const { data } = await supabase
        .from("radius_users")
        .select("id, username, data_used_mb, status, mikrotik_router_id, plan_id")
        .eq("id", userId)
        .eq("status", "active")
        .maybeSingle();
      if (data) usersToCheck = [data];
    } else {
      // Check all active users
      const { data } = await supabase
        .from("radius_users")
        .select("id, username, data_used_mb, status, mikrotik_router_id, plan_id")
        .eq("status", "active")
        .not("plan_id", "is", null);
      if (data) usersToCheck = data;
    }

    if (usersToCheck.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users to check", expired: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all relevant plans
    const planIds = [...new Set(usersToCheck.map(u => u.plan_id).filter(Boolean))];
    const { data: plans } = await supabase
      .from("billing_plans")
      .select("id, data_limit_mb, name")
      .in("id", planIds);

    const planMap = new Map((plans || []).map(p => [p.id, p]));

    // Get routers for users that need to be disabled
    const routerIds = [...new Set(usersToCheck.map(u => u.mikrotik_router_id).filter(Boolean))];
    let routerMap = new Map<string, RouterConfig>();
    if (routerIds.length > 0) {
      const { data: routers } = await supabase
        .from("mikrotik_routers")
        .select("id, host, port, username, password, use_ssl, connection_mode")
        .in("id", routerIds)
        .eq("is_active", true);
      if (routers) {
        routerMap = new Map(routers.map(r => [r.id, {
          host: r.host,
          port: r.port?.toString() || "8728",
          username: r.username,
          password: r.password,
          useSsl: r.use_ssl,
          connectionMode: r.connection_mode as "api" | "rest",
        }]));
      }
    }

    let expiredCount = 0;

    for (const user of usersToCheck) {
      const plan = user.plan_id ? planMap.get(user.plan_id) : null;
      if (!plan || !plan.data_limit_mb || Number(plan.data_limit_mb) <= 0) continue;

      const dataUsed = Number(user.data_used_mb) || 0;
      const dataLimit = Number(plan.data_limit_mb);

      if (dataUsed >= dataLimit) {
        // Set user status to expired
        await supabase
          .from("radius_users")
          .update({ status: "expired" })
          .eq("id", user.id);

        // Disable on MikroTik
        if (user.mikrotik_router_id) {
          const router = routerMap.get(user.mikrotik_router_id);
          if (router) {
            // Find user on router and disable
            const existing = await mikrotikRestRequest(router, `/ip/hotspot/user?=name=${user.username}`);
            if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
              const mikrotikUserId = (existing.data[0] as Record<string, string>)[".id"];
              await mikrotikRestRequest(router, `/ip/hotspot/user/${mikrotikUserId}`, "PATCH", {
                disabled: "yes",
              });
            }
          }
        }

        expiredCount++;
        console.log(`User ${user.username} exceeded data limit (${dataUsed}MB / ${dataLimit}MB) - disabled`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, checked: usersToCheck.length, expired: expiredCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
