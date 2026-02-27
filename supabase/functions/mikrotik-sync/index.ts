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

async function getDefaultRouter(supabase: ReturnType<typeof createClient>): Promise<RouterConfig | null> {
  const { data } = await supabase
    .from("mikrotik_routers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  if (data && data.length > 0) {
    const r = data[0];
    return {
      host: r.host,
      port: r.port?.toString() || "8728",
      username: r.username,
      password: r.password,
      connectionMode: (r.connection_mode as "api" | "rest") || "api",
      useSsl: r.use_ssl ?? false,
    };
  }
  return null;
}

function getConfiguredPort(router: RouterConfig): number {
  const parsed = typeof router.port === "string" ? parseInt(router.port, 10) : router.port;
  return Number.isFinite(parsed) ? parsed : 8728;
}

function getRestPort(router: RouterConfig): number {
  const port = getConfiguredPort(router);
  // MikroTik binary API ports - auto-map to REST API ports
  if (port === 8728) return 80;   // API -> HTTP REST
  if (port === 8729) return 443;  // API-SSL -> HTTPS REST
  return port; // User specified a custom port, use as-is
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
    { port: mappedRestPort, useRestPrefix: true, label: "mapped-port + /rest" },
    { port: configuredPort, useRestPrefix: true, label: "configured-port + /rest" },
    { port: mappedRestPort, useRestPrefix: false, label: "mapped-port (no /rest)" },
    { port: configuredPort, useRestPrefix: false, label: "configured-port (no /rest)" },
  ];

  const deduped = variants.filter((v, idx, arr) => {
    return arr.findIndex((x) => x.port === v.port && x.useRestPrefix === v.useRestPrefix) === idx;
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: "Basic " + btoa(`${router.username}:${router.password}`),
  };

  const attemptErrors: string[] = [];

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
        if (!text || text.trim() === "") {
          return { success: true, data: {} };
        }

        try {
          const data = JSON.parse(text);
          return { success: true, data };
        } catch {
          return { success: true, data: { raw: text } };
        }
      }

      attemptErrors.push(`[${variant.label}] ${response.status} - ${text}`);

      // Keep trying fallback URL variants only for 404 (endpoint not found).
      if (response.status !== 404) {
        return {
          success: false,
          error: `MikroTik API error: ${response.status} - ${text}`,
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("abort")) {
        attemptErrors.push(`[${variant.label}] Connection timed out: ${url}`);
      } else {
        attemptErrors.push(`[${variant.label}] Connection failed: ${url} (${message})`);
      }
    }
  }

  return {
    success: false,
    error: `MikroTik REST API is unavailable on this router. This usually means RouterOS is below v7.1 or /rest is not enabled. Tried: ${attemptErrors.join(" | ")}`,
  };
}

async function handleTestConnection(router: RouterConfig) {
  // Try REST API first (/rest/system/resource)
  const result = await mikrotikRestRequest(router, "/system/resource");
  return result;
}

async function handleGetSessions(router: RouterConfig) {
  const result = await mikrotikRestRequest(router, "/ip/hotspot/active");
  if (result.success) {
    return { success: true, data: result.data };
  }
  return result;
}

async function handleGetUserBandwidth(router: RouterConfig, username: string) {
  const result = await mikrotikRestRequest(router, `/ip/hotspot/active?=user=${username}`);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return result;
}

async function ensureProfileExists(router: RouterConfig, profile: string) {
  const existing = await mikrotikRestRequest(router, `/ip/hotspot/user/profile?=name=${profile}`);
  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    return; // Profile already exists
  }
  // Create the profile on the router
  await mikrotikRestRequest(router, "/ip/hotspot/user/profile/add", "POST", { name: profile });
}

async function handleSyncUser(
  router: RouterConfig,
  username: string,
  password: string,
  profile?: string,
  macAddress?: string,
  disabled?: boolean
) {
  // Ensure profile exists on router before assigning
  if (profile) {
    await ensureProfileExists(router, profile);
  }

  // Check if user exists
  const existing = await mikrotikRestRequest(router, `/ip/hotspot/user?=name=${username}`);

  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    // Update existing user
    const userId = (existing.data[0] as Record<string, string>)[".id"];
    const updateBody: Record<string, unknown> = { password };
    if (profile) updateBody.profile = profile;
    if (macAddress) updateBody["mac-address"] = macAddress;
    if (disabled !== undefined) updateBody.disabled = disabled ? "yes" : "no";

    const updateResult = await mikrotikRestRequest(router, `/ip/hotspot/user/${userId}`, "PATCH", updateBody);
    return updateResult;
  } else {
    // Create new user
    const createBody: Record<string, unknown> = { name: username, password };
    if (profile) createBody.profile = profile;
    if (macAddress) createBody["mac-address"] = macAddress;
    if (disabled !== undefined) createBody.disabled = disabled ? "yes" : "no";

    const createResult = await mikrotikRestRequest(router, "/ip/hotspot/user/add", "POST", createBody);
    return createResult;
  }
}

async function handleDeleteUser(router: RouterConfig, username: string) {
  const existing = await mikrotikRestRequest(router, `/ip/hotspot/user?=name=${username}`);
  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    const userId = (existing.data[0] as Record<string, string>)[".id"];
    return await mikrotikRestRequest(router, `/ip/hotspot/user/${userId}`, "DELETE");
  }
  return { success: true, data: { message: "User not found on router, nothing to delete" } };
}

async function handleDisconnectUser(router: RouterConfig, username: string) {
  const sessions = await mikrotikRestRequest(router, `/ip/hotspot/active?=user=${username}`);
  if (sessions.success && Array.isArray(sessions.data)) {
    for (const session of sessions.data) {
      const sessionId = (session as Record<string, string>)[".id"];
      await mikrotikRestRequest(router, `/ip/hotspot/active/remove`, "POST", { ".id": sessionId });
    }
    return { success: true, data: { disconnected: (sessions.data as unknown[]).length } };
  }
  return { success: true, data: { disconnected: 0, message: "No active session found" } };
}

async function handleExpireUser(router: RouterConfig, username: string, expiredProfile: string, behavior?: string) {
  const existing = await mikrotikRestRequest(router, `/ip/hotspot/user?=name=${username}`);
  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    const userId = (existing.data[0] as Record<string, string>)[".id"];
    
    if (behavior === 'disable_user') {
      // Disable the user on the router
      return await mikrotikRestRequest(router, `/ip/hotspot/user/${userId}`, "PATCH", { disabled: "yes" });
    } else {
      // Change profile to expired profile
      await ensureProfileExists(router, expiredProfile);
      return await mikrotikRestRequest(router, `/ip/hotspot/user/${userId}`, "PATCH", { profile: expiredProfile });
    }
  }
  return { success: false, error: "User not found on router" };
}

async function handleSetMacBinding(
  router: RouterConfig,
  username: string,
  macAddress: string,
  locked: boolean,
  _profile?: string
) {
  const existing = await mikrotikRestRequest(router, `/ip/hotspot/user?=name=${username}`);
  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    const userId = (existing.data[0] as Record<string, string>)[".id"];
    const update: Record<string, unknown> = {};
    if (locked && macAddress) {
      update["mac-address"] = macAddress;
    } else {
      update["mac-address"] = "";
    }
    return await mikrotikRestRequest(router, `/ip/hotspot/user/${userId}`, "PATCH", update);
  }
  return { success: false, error: "User not found on router" };
}

async function handleSyncAllUsers(supabase: ReturnType<typeof createClient>, router: RouterConfig) {
  const { data: users, error } = await supabase
    .from("radius_users")
    .select("username, password_hash, service_type, status, billing_plans(name)")
    .eq("service_type", "hotspot");

  if (error) return { success: false, error: error.message };

  const results = [];
  for (const user of users || []) {
    const profile = (user as any).billing_plans?.name;
    const isDisabled = user.status !== "active";
    const result = await handleSyncUser(router, user.username, user.password_hash, profile, undefined, isDisabled);
    results.push({ username: user.username, ...result });
  }

  return { success: true, data: results };
}

async function handleSyncUsers(supabase: ReturnType<typeof createClient>, router: RouterConfig) {
  const { data: users, error } = await supabase
    .from("radius_users")
    .select("username, password_hash, status, billing_plans(name)")
    .eq("service_type", "hotspot");

  if (error) return { success: false, error: error.message };
  if (!users || users.length === 0) return { success: true, data: { synced: 0, failed: 0, message: "No hotspot users to sync" } };

  let synced = 0, failed = 0;
  for (const user of users) {
    const profile = (user as any).billing_plans?.name;
    const isDisabled = user.status !== "active";
    const result = await handleSyncUser(router, user.username, user.password_hash, profile, undefined, isDisabled);
    if (result.success) synced++;
    else failed++;
  }

  return { success: true, data: { synced, failed, total: users.length } };
}

async function handleSyncPlans(router: RouterConfig, supabase: ReturnType<typeof createClient>) {
  const { data: plans, error } = await supabase.from("billing_plans").select("*").eq("is_active", true);
  if (error) return { success: false, error: error.message };

  for (const plan of plans || []) {
    // Check if profile exists
    const existing = await mikrotikRestRequest(router, `/ip/hotspot/user/profile?=name=${plan.name}`);
    if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
      // Update
      const profileId = (existing.data[0] as Record<string, string>)[".id"];
      const body: Record<string, unknown> = {};
      if (plan.download_speed_kbps) body["rate-limit"] = `${plan.upload_speed_kbps || 0}k/${plan.download_speed_kbps}k`;
      // Set data limit (transfer-limit) if plan has data_limit_mb
      if (plan.data_limit_mb && plan.data_limit_mb > 0) {
        const bytes = Math.round(plan.data_limit_mb * 1024 * 1024);
        body["transfer-limit"] = `${bytes}`;
      }
      await mikrotikRestRequest(router, `/ip/hotspot/user/profile/${profileId}`, "PATCH", body);
    } else {
      // Create
      const body: Record<string, unknown> = { name: plan.name };
      if (plan.download_speed_kbps) body["rate-limit"] = `${plan.upload_speed_kbps || 0}k/${plan.download_speed_kbps}k`;
      if (plan.data_limit_mb && plan.data_limit_mb > 0) {
        const bytes = Math.round(plan.data_limit_mb * 1024 * 1024);
        body["transfer-limit"] = `${bytes}`;
      }
      await mikrotikRestRequest(router, "/ip/hotspot/user/profile/add", "POST", body);
    }
  }

  return { success: true, data: { message: "Plans synced successfully" } };
}

async function handleImportUsers(router: RouterConfig, supabase: ReturnType<typeof createClient>) {
  const result = await mikrotikRestRequest(router, "/ip/hotspot/user");
  if (!result.success) return result;

  const mikrotikUsers = result.data as Array<Record<string, string>>;
  let imported = 0, skipped = 0;

  for (const mUser of mikrotikUsers) {
    const username = mUser.name;
    if (!username || username === "default-trial") { skipped++; continue; }

    // Check if already exists in DB
    const { data: existing } = await supabase
      .from("radius_users")
      .select("id")
      .eq("username", username)
      .limit(1);

    if (existing && existing.length > 0) { skipped++; continue; }

    // Import
    const { error } = await supabase.from("radius_users").insert({
      username,
      password_hash: mUser.password || "imported",
      service_type: "hotspot",
      status: "active",
    });

    if (!error) imported++;
    else skipped++;
  }

  return { success: true, data: { imported, skipped, total: mikrotikUsers.length } };
}

async function handleImportPlans(router: RouterConfig, supabase: ReturnType<typeof createClient>) {
  const result = await mikrotikRestRequest(router, "/ip/hotspot/user/profile");
  if (!result.success) return result;

  const profiles = result.data as Array<Record<string, string>>;
  let imported = 0, skipped = 0;

  for (const profile of profiles) {
    const name = profile.name;
    if (!name || name === "default") { skipped++; continue; }

    const { data: existing } = await supabase
      .from("billing_plans")
      .select("id")
      .eq("name", name)
      .limit(1);

    if (existing && existing.length > 0) { skipped++; continue; }

    const { error } = await supabase.from("billing_plans").insert({
      name,
      price: 0,
      service_type: "hotspot",
      is_active: true,
    });

    if (!error) imported++;
    else skipped++;
  }

  return { success: true, data: { imported, skipped, total: profiles.length } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, router: routerConfig, username, password, profile, mac_address, service_type, expired_profile_name, locked, disabled, behavior } = body;

    // Resolve router config
    let router: RouterConfig | null = routerConfig || null;
    if (!router) {
      router = await getDefaultRouter(supabase);
    }

    if (!router && action !== "test-connection") {
      return new Response(
        JSON.stringify({ success: false, error: "No router configured. Please add a router first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { success: boolean; data?: unknown; error?: string };

    switch (action) {
      case "test-connection":
        if (!router) {
          result = { success: false, error: "No router configuration provided" };
        } else {
          result = await handleTestConnection(router);
        }
        break;

      case "get-sessions":
        result = await handleGetSessions(router!);
        break;

      case "get-user-bandwidth":
        result = await handleGetUserBandwidth(router!, username);
        break;

      case "sync-user":
        result = await handleSyncUser(router!, username, password, profile, mac_address, disabled);
        break;

      case "delete-user":
        result = await handleDeleteUser(router!, username);
        break;

      case "disconnect-user":
        result = await handleDisconnectUser(router!, username);
        break;

      case "expire-user":
        result = await handleExpireUser(router!, username, expired_profile_name || "expired", behavior);
        break;

      case "set-mac-binding":
        result = await handleSetMacBinding(router!, username, mac_address, locked, profile);
        break;

      case "sync-all-users":
        result = await handleSyncAllUsers(supabase, router!);
        break;

      case "sync-users":
        result = await handleSyncUsers(supabase, router!);
        break;

      case "sync-plans":
        result = await handleSyncPlans(router!, supabase);
        break;

      case "import-users":
        result = await handleImportUsers(router!, supabase);
        break;

      case "import-plans":
        result = await handleImportPlans(router!, supabase);
        break;

      case "auto-mac-binding": {
        // Get active session for user to detect MAC from connected device
        const sessions = await mikrotikRestRequest(router!, `/ip/hotspot/active?=user=${username}`);
        if (sessions.success && Array.isArray(sessions.data) && sessions.data.length > 0) {
          const session = sessions.data[0] as Record<string, string>;
          const detectedMac = session["mac-address"];
          if (detectedMac) {
            // Set the detected MAC on the hotspot user
            const existingUser = await mikrotikRestRequest(router!, `/ip/hotspot/user?=name=${username}`);
            if (existingUser.success && Array.isArray(existingUser.data) && existingUser.data.length > 0) {
              const userId = (existingUser.data[0] as Record<string, string>)[".id"];
              await mikrotikRestRequest(router!, `/ip/hotspot/user/${userId}`, "PATCH", { "mac-address": detectedMac });
              
              // Also update in database
              await supabase
                .from("radius_users")
                .update({ mac_address: detectedMac, mac_locked: true })
                .eq("username", username);
              
              result = { success: true, data: { mac: detectedMac, message: "MAC auto-bound from active session" } };
            } else {
              result = { success: false, error: "User not found on router" };
            }
          } else {
            result = { success: false, error: "No MAC detected in active session" };
          }
        } else {
          result = { success: false, error: "No active session found for user" };
        }
        break;
      }

      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

    const nonFatalActions = new Set(["test-connection", "get-sessions", "get-user-bandwidth"]);
    const status = result.success ? 200 : (nonFatalActions.has(action) ? 200 : 400);
    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
