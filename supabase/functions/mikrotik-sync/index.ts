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

// ─── MikroTik Binary API Protocol (TCP) ────────────────────────────────
// Implements the word-length-encoded protocol for RouterOS API (ports 8728/8729)
// This works with ALL RouterOS versions, unlike REST which requires v7.1+

function encodeLength(len: number): Uint8Array {
  if (len < 0x80) {
    return new Uint8Array([len]);
  } else if (len < 0x4000) {
    return new Uint8Array([((len >> 8) & 0x3f) | 0x80, len & 0xff]);
  } else if (len < 0x200000) {
    return new Uint8Array([((len >> 16) & 0x1f) | 0xc0, (len >> 8) & 0xff, len & 0xff]);
  } else if (len < 0x10000000) {
    return new Uint8Array([((len >> 24) & 0x0f) | 0xe0, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]);
  } else {
    return new Uint8Array([0xf0, (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]);
  }
}

function encodeWord(word: string): Uint8Array {
  const encoder = new TextEncoder();
  const wordBytes = encoder.encode(word);
  const lengthBytes = encodeLength(wordBytes.length);
  const result = new Uint8Array(lengthBytes.length + wordBytes.length);
  result.set(lengthBytes, 0);
  result.set(wordBytes, lengthBytes.length);
  return result;
}

function encodeSentence(words: string[]): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const word of words) {
    parts.push(encodeWord(word));
  }
  // End of sentence marker (zero-length word)
  parts.push(new Uint8Array([0]));
  
  let totalLen = 0;
  for (const p of parts) totalLen += p.length;
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}

async function readExact(reader: ReadableStreamDefaultReader<Uint8Array>, n: number): Promise<Uint8Array> {
  const result = new Uint8Array(n);
  let offset = 0;
  while (offset < n) {
    const { value, done } = await reader.read();
    if (done || !value) throw new Error("Connection closed unexpectedly");
    const toCopy = Math.min(value.length, n - offset);
    result.set(value.subarray(0, toCopy), offset);
    offset += toCopy;
    // If we read more than needed, we have a problem with streaming.
    // For simplicity, we'll use a buffered approach instead.
  }
  return result;
}

class MikrotikApiConnection {
  private conn: Deno.TcpConn | Deno.TlsConn | null = null;
  private buffer: Uint8Array = new Uint8Array(0);

  async connect(host: string, port: number, useSsl: boolean): Promise<void> {
    if (useSsl) {
      this.conn = await Deno.connectTls({ hostname: host, port });
    } else {
      this.conn = await Deno.connect({ hostname: host, port });
    }
  }

  async close(): Promise<void> {
    try { this.conn?.close(); } catch { /* ignore */ }
  }

  private async readBytes(n: number): Promise<Uint8Array> {
    while (this.buffer.length < n) {
      const chunk = new Uint8Array(4096);
      const bytesRead = await this.conn!.read(chunk);
      if (bytesRead === null) throw new Error("Connection closed");
      const newBuf = new Uint8Array(this.buffer.length + bytesRead);
      newBuf.set(this.buffer, 0);
      newBuf.set(chunk.subarray(0, bytesRead), this.buffer.length);
      this.buffer = newBuf;
    }
    const result = this.buffer.subarray(0, n);
    this.buffer = this.buffer.subarray(n);
    return result;
  }

  private async readLength(): Promise<number> {
    const first = (await this.readBytes(1))[0];
    if ((first & 0x80) === 0) return first;
    if ((first & 0xc0) === 0x80) {
      const second = (await this.readBytes(1))[0];
      return ((first & 0x3f) << 8) | second;
    }
    if ((first & 0xe0) === 0xc0) {
      const rest = await this.readBytes(2);
      return ((first & 0x1f) << 16) | (rest[0] << 8) | rest[1];
    }
    if ((first & 0xf0) === 0xe0) {
      const rest = await this.readBytes(3);
      return ((first & 0x0f) << 24) | (rest[0] << 16) | (rest[1] << 8) | rest[2];
    }
    // 5-byte length
    const rest = await this.readBytes(4);
    return (rest[0] << 24) | (rest[1] << 16) | (rest[2] << 8) | rest[3];
  }

  private async readWord(): Promise<string> {
    const len = await this.readLength();
    if (len === 0) return "";
    const bytes = await this.readBytes(len);
    return new TextDecoder().decode(bytes);
  }

  async readSentence(): Promise<string[]> {
    const words: string[] = [];
    while (true) {
      const word = await this.readWord();
      if (word === "") break;
      words.push(word);
    }
    return words;
  }

  async writeSentence(words: string[]): Promise<void> {
    const data = encodeSentence(words);
    let written = 0;
    while (written < data.length) {
      const n = await this.conn!.write(data.subarray(written));
      written += n;
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    await this.writeSentence(["/login", `=name=${username}`, `=password=${password}`]);
    const response = await this.readSentence();
    return response.length > 0 && response[0] === "!done";
  }

  async command(words: string[]): Promise<Record<string, string>[]> {
    await this.writeSentence(words);
    
    const results: Record<string, string>[] = [];
    while (true) {
      const sentence = await this.readSentence();
      if (sentence.length === 0) continue;
      
      const type = sentence[0];
      if (type === "!done") break;
      if (type === "!trap") {
        const errorMsg = sentence.find(w => w.startsWith("=message="))?.substring(9) || "Unknown API error";
        throw new Error(errorMsg);
      }
      if (type === "!re") {
        const record: Record<string, string> = {};
        for (let i = 1; i < sentence.length; i++) {
          const word = sentence[i];
          if (word.startsWith("=")) {
            const eqIdx = word.indexOf("=", 1);
            if (eqIdx > 0) {
              const key = word.substring(1, eqIdx);
              const value = word.substring(eqIdx + 1);
              record[key] = value;
            }
          }
        }
        results.push(record);
      }
    }
    return results;
  }
}

async function mikrotikApiRequest(
  router: RouterConfig,
  path: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const port = getConfiguredPort(router);
  const conn = new MikrotikApiConnection();
  
  try {
    // Connect with timeout
    const connectPromise = conn.connect(router.host, port, router.useSsl ?? false);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Connection timed out")), 15000)
    );
    await Promise.race([connectPromise, timeoutPromise]);

    // Login
    const loginOk = await conn.login(router.username, router.password);
    if (!loginOk) {
      return { success: false, error: "Login failed - check credentials" };
    }

    // Convert REST-style path + method to API command
    const apiWords = restPathToApiCommand(path, method, body);
    const results = await conn.command(apiWords);
    
    return { success: true, data: results };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `MikroTik API error: ${message}` };
  } finally {
    await conn.close();
  }
}

/**
 * Converts a REST-style path and method into MikroTik API command words.
 * Examples:
 *   GET  /ip/hotspot/user           -> ["/ip/hotspot/user/print"]
 *   GET  /ip/hotspot/user?=name=foo -> ["/ip/hotspot/user/print", "?=name=foo"]  
 *   POST /ip/hotspot/user/add       -> ["/ip/hotspot/user/add", "=key=value", ...]
 *   PATCH /ip/hotspot/user/*1       -> ["/ip/hotspot/user/set", "=.id=*1", "=key=value", ...]
 *   DELETE /ip/hotspot/user/*1      -> ["/ip/hotspot/user/remove", "=.id=*1"]
 */
function restPathToApiCommand(path: string, method: string, body?: Record<string, unknown>): string[] {
  // Split query parameters from path
  let basePath = path;
  let queryFilter = "";
  const qIdx = path.indexOf("?");
  if (qIdx >= 0) {
    basePath = path.substring(0, qIdx);
    queryFilter = path.substring(qIdx + 1);
  }

  const words: string[] = [];

  if (method === "GET") {
    // Check if path ends with /add or /remove (used in some REST-style calls)
    words.push(basePath.endsWith("/print") ? basePath : `${basePath}/print`);
    // Add query filter as API filter
    if (queryFilter) {
      // queryFilter might be like "=name=foo" or "=user=bar"
      words.push(`?${queryFilter}`);
    }
  } else if (method === "POST") {
    // POST is used for add/remove operations
    if (basePath.endsWith("/add") || basePath.endsWith("/remove")) {
      words.push(basePath);
    } else {
      words.push(`${basePath}/add`);
    }
    if (body) {
      // Check for .id in body (used in remove operations)
      if (body[".id"]) {
        words.push(`=.id=${body[".id"]}`);
      }
      for (const [key, value] of Object.entries(body)) {
        if (key === ".id") continue;
        words.push(`=${key}=${value}`);
      }
    }
  } else if (method === "PATCH") {
    // PATCH -> /set with .id extracted from path
    const parts = basePath.split("/");
    const lastPart = parts[parts.length - 1];
    
    // If last part starts with * it's a MikroTik ID
    if (lastPart.startsWith("*")) {
      const setPath = parts.slice(0, -1).join("/") + "/set";
      words.push(setPath);
      words.push(`=.id=${lastPart}`);
    } else {
      words.push(`${basePath}/set`);
    }
    
    if (body) {
      for (const [key, value] of Object.entries(body)) {
        words.push(`=${key}=${value}`);
      }
    }
  } else if (method === "DELETE") {
    const parts = basePath.split("/");
    const lastPart = parts[parts.length - 1];
    
    if (lastPart.startsWith("*")) {
      const removePath = parts.slice(0, -1).join("/") + "/remove";
      words.push(removePath);
      words.push(`=.id=${lastPart}`);
    } else {
      words.push(`${basePath}/remove`);
    }
  }

  return words;
}

/**
 * Unified request function that routes to API or REST based on router config.
 */
async function mikrotikRequest(
  router: RouterConfig,
  path: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  if (router.connectionMode === "api") {
    return mikrotikApiRequest(router, path, method, body);
  }
  return mikrotikRestRequest(router, path, method, body);
}

// ─── REST API Protocol (HTTP) ──────────────────────────────────────────
// Works only with RouterOS v7.1+ which has /rest endpoint

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

// ─── Action Handlers (now use unified mikrotikRequest) ─────────────────

async function handleTestConnection(router: RouterConfig) {
  const result = await mikrotikRequest(router, "/system/resource");
  return result;
}

async function handleGetSessions(router: RouterConfig) {
  const result = await mikrotikRequest(router, "/ip/hotspot/active");
  if (result.success) {
    return { success: true, data: result.data };
  }
  return result;
}

async function handleGetUserBandwidth(
  router: RouterConfig,
  username: string,
  supabase: ReturnType<typeof createClient>,
  radiusUserId?: string,
  serviceType?: string
) {
  const path = serviceType === "pppoe"
    ? `/ppp/active?=name=${username}`
    : `/ip/hotspot/active?=user=${username}`;

  const result = await mikrotikRequest(router, path);
  if (!result.success) return result;

  const sessions = Array.isArray(result.data) ? result.data : [];

  // Log connect/disconnect events based on session presence
  if (radiusUserId) {
    const { data: lastEvent } = await supabase
      .from("mikrotik_sync_log")
      .select("action")
      .eq("radius_user_id", radiusUserId)
      .in("action", ["connect", "disconnect"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastAction = lastEvent?.action || null;
    const isOnline = sessions.length > 0;

    if (isOnline && lastAction !== "connect") {
      await supabase.from("mikrotik_sync_log").insert({
        radius_user_id: radiusUserId,
        action: "connect",
        status: "success",
        success: true,
        details: { username, service_type: serviceType || "hotspot" },
      });
    } else if (!isOnline && lastAction === "connect") {
      await supabase.from("mikrotik_sync_log").insert({
        radius_user_id: radiusUserId,
        action: "disconnect",
        status: "success",
        success: true,
        details: { username, service_type: serviceType || "hotspot" },
      });
    }
  }

  // Record bandwidth history and update data_used_mb
  if (radiusUserId && sessions.length > 0) {
    const session = sessions[0] as Record<string, string>;
    const bytesIn = parseInt(session["bytes-in"] || "0", 10);
    const bytesOut = parseInt(session["bytes-out"] || "0", 10);
    const uptime = session["uptime"] || null;

    const { data: lastRecord } = await supabase
      .from("bandwidth_history")
      .select("bytes_in, bytes_out, recorded_at")
      .eq("radius_user_id", radiusUserId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let downloadRateBps = 0;
    let uploadRateBps = 0;

    if (lastRecord) {
      const timeDiffMs = Date.now() - new Date(lastRecord.recorded_at).getTime();
      const timeDiffSec = timeDiffMs / 1000;
      if (timeDiffSec > 0 && timeDiffSec < 60) {
        downloadRateBps = Math.max(0, Math.round((bytesIn - (lastRecord.bytes_in || 0)) / timeDiffSec));
        uploadRateBps = Math.max(0, Math.round((bytesOut - (lastRecord.bytes_out || 0)) / timeDiffSec));
      }
    }

    const shouldRecord = !lastRecord ||
      (Date.now() - new Date(lastRecord.recorded_at).getTime()) > 4000;

    if (shouldRecord) {
      await supabase.from("bandwidth_history").insert({
        radius_user_id: radiusUserId,
        bytes_in: bytesIn,
        bytes_out: bytesOut,
        download_rate_bps: downloadRateBps,
        upload_rate_bps: uploadRateBps,
        download_bytes: bytesIn,
        upload_bytes: bytesOut,
        session_uptime: uptime,
        recorded_at: new Date().toISOString(),
      });

      const totalBytes = bytesIn + bytesOut;
      const dataUsedMb = totalBytes / (1024 * 1024);
      const roundedMb = Math.round(dataUsedMb * 100) / 100;
      await supabase
        .from("radius_users")
        .update({ data_used_mb: roundedMb })
        .eq("id", radiusUserId);

      // Immediate data limit check
      const { data: userData } = await supabase
        .from("radius_users")
        .select("plan_id, status")
        .eq("id", radiusUserId)
        .maybeSingle();

      if (userData?.plan_id && userData.status === "active") {
        const { data: planData } = await supabase
          .from("billing_plans")
          .select("data_limit_mb")
          .eq("id", userData.plan_id)
          .maybeSingle();

        const dataLimitMb = Number(planData?.data_limit_mb) || 0;
        if (dataLimitMb > 0 && roundedMb >= dataLimitMb) {
          await supabase
            .from("radius_users")
            .update({ status: "expired" })
            .eq("id", radiusUserId);

          const activePath = serviceType === "pppoe"
            ? `/ppp/active?=name=${username}`
            : `/ip/hotspot/active?=user=${username}`;
          const activeResult = await mikrotikRequest(router, activePath);
          if (activeResult.success && Array.isArray(activeResult.data)) {
            for (const s of activeResult.data as Record<string, string>[]) {
              const sid = s[".id"];
              if (sid) {
                const removePath = serviceType === "pppoe"
                  ? `/ppp/active/${sid}`
                  : `/ip/hotspot/active/${sid}`;
                await mikrotikRequest(router, removePath, "DELETE");
              }
            }
          }

          const userListPath = serviceType === "pppoe"
            ? `/ppp/secret?=name=${username}`
            : `/ip/hotspot/user?=name=${username}`;
          const userListResult = await mikrotikRequest(router, userListPath);
          if (userListResult.success && Array.isArray(userListResult.data) && userListResult.data.length > 0) {
            const mkId = (userListResult.data[0] as Record<string, string>)[".id"];
            if (mkId) {
              const disablePath = serviceType === "pppoe"
                ? `/ppp/secret/${mkId}`
                : `/ip/hotspot/user/${mkId}`;
              await mikrotikRequest(router, disablePath, "PATCH", { disabled: "yes" });
            }
          }

          console.log(`User ${username} exceeded data limit (${roundedMb}MB / ${dataLimitMb}MB) - expired & disconnected immediately`);
        }
      }
    }
  }

  return { success: true, data: result.data };
}

async function ensureProfileExists(router: RouterConfig, profile: string) {
  const existing = await mikrotikRequest(router, `/ip/hotspot/user/profile?=name=${profile}`);
  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    return;
  }
  await mikrotikRequest(router, "/ip/hotspot/user/profile/add", "POST", { name: profile });
}

async function handleSyncUser(
  router: RouterConfig,
  username: string,
  password: string,
  profile?: string,
  macAddress?: string,
  disabled?: boolean
) {
  if (profile) {
    await ensureProfileExists(router, profile);
  }

  const existing = await mikrotikRequest(router, `/ip/hotspot/user?=name=${username}`);

  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    const userId = (existing.data[0] as Record<string, string>)[".id"];
    const updateBody: Record<string, unknown> = { password };
    if (profile) updateBody.profile = profile;
    if (macAddress) updateBody["mac-address"] = macAddress;
    if (disabled !== undefined) updateBody.disabled = disabled ? "yes" : "no";

    const updateResult = await mikrotikRequest(router, `/ip/hotspot/user/${userId}`, "PATCH", updateBody);
    return updateResult;
  } else {
    const createBody: Record<string, unknown> = { name: username, password };
    if (profile) createBody.profile = profile;
    if (macAddress) createBody["mac-address"] = macAddress;
    if (disabled !== undefined) createBody.disabled = disabled ? "yes" : "no";

    const createResult = await mikrotikRequest(router, "/ip/hotspot/user/add", "POST", createBody);
    return createResult;
  }
}

async function handleDeleteUser(router: RouterConfig, username: string) {
  let disconnectedSessions = 0;
  let removedCookies = 0;

  // 1. Remove from active sessions list
  const sessions = await mikrotikRequest(router, `/ip/hotspot/active?=user=${username}`);
  if (sessions.success && Array.isArray(sessions.data)) {
    for (const session of sessions.data) {
      const sessionId = (session as Record<string, string>)[".id"];
      if (sessionId) {
        await mikrotikRequest(router, `/ip/hotspot/active/remove`, "POST", { ".id": sessionId });
      }
    }
    disconnectedSessions = (sessions.data as unknown[]).length;
  }

  // 2. Delete cookies for this user
  const cookies = await mikrotikRequest(router, `/ip/hotspot/cookie?=user=${username}`);
  if (cookies.success && Array.isArray(cookies.data)) {
    for (const cookie of cookies.data) {
      const cookieId = (cookie as Record<string, string>)[".id"];
      if (cookieId) {
        await mikrotikRequest(router, `/ip/hotspot/cookie/remove`, "POST", { ".id": cookieId });
      }
    }
    removedCookies = (cookies.data as unknown[]).length;
  }

  // 3. Delete the hotspot user entry
  const existing = await mikrotikRequest(router, `/ip/hotspot/user?=name=${username}`);
  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    const userId = (existing.data[0] as Record<string, string>)[".id"];
    await mikrotikRequest(router, `/ip/hotspot/user/${userId}`, "DELETE");
  }

  return { success: true, data: { message: "User deleted", disconnected: disconnectedSessions, cookies_removed: removedCookies } };
}

async function handleDisconnectUser(router: RouterConfig, username: string) {
  let disconnectedSessions = 0;
  let removedCookies = 0;

  const sessions = await mikrotikRequest(router, `/ip/hotspot/active?=user=${username}`);
  if (sessions.success && Array.isArray(sessions.data)) {
    for (const session of sessions.data) {
      const sessionId = (session as Record<string, string>)[".id"];
      await mikrotikRequest(router, `/ip/hotspot/active/remove`, "POST", { ".id": sessionId });
    }
    disconnectedSessions = (sessions.data as unknown[]).length;
  }

  const cookies = await mikrotikRequest(router, `/ip/hotspot/cookie?=user=${username}`);
  if (cookies.success && Array.isArray(cookies.data)) {
    for (const cookie of cookies.data) {
      const cookieId = (cookie as Record<string, string>)[".id"];
      if (cookieId) {
        await mikrotikRequest(router, `/ip/hotspot/cookie/remove`, "POST", { ".id": cookieId });
      }
    }
    removedCookies = (cookies.data as unknown[]).length;
  }

  return { success: true, data: { disconnected: disconnectedSessions, cookies_removed: removedCookies } };
}

async function handleExpireUser(router: RouterConfig, username: string, expiredProfile: string, behavior?: string) {
  const existing = await mikrotikRequest(router, `/ip/hotspot/user?=name=${username}`);
  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    const userId = (existing.data[0] as Record<string, string>)[".id"];
    
    if (behavior === 'disable_user') {
      return await mikrotikRequest(router, `/ip/hotspot/user/${userId}`, "PATCH", { disabled: "yes" });
    } else {
      await ensureProfileExists(router, expiredProfile);
      return await mikrotikRequest(router, `/ip/hotspot/user/${userId}`, "PATCH", { profile: expiredProfile });
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
  const existing = await mikrotikRequest(router, `/ip/hotspot/user?=name=${username}`);
  if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
    const userId = (existing.data[0] as Record<string, string>)[".id"];
    const update: Record<string, unknown> = {};
    if (locked && macAddress) {
      update["mac-address"] = macAddress;
    } else {
      update["mac-address"] = "00:00:00:00:00:00";
    }
    return await mikrotikRequest(router, `/ip/hotspot/user/${userId}`, "PATCH", update);
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
    const existing = await mikrotikRequest(router, `/ip/hotspot/user/profile?=name=${plan.name}`);
    if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
      const profileId = (existing.data[0] as Record<string, string>)[".id"];
      const body: Record<string, unknown> = {};
      if (plan.download_speed_kbps) body["rate-limit"] = `${plan.upload_speed_kbps || 0}k/${plan.download_speed_kbps}k`;
      if (plan.data_limit_mb && plan.data_limit_mb > 0) {
        const bytes = Math.round(plan.data_limit_mb * 1024 * 1024);
        body["transfer-limit"] = `${bytes}`;
      }
      await mikrotikRequest(router, `/ip/hotspot/user/profile/${profileId}`, "PATCH", body);
    } else {
      const body: Record<string, unknown> = { name: plan.name };
      if (plan.download_speed_kbps) body["rate-limit"] = `${plan.upload_speed_kbps || 0}k/${plan.download_speed_kbps}k`;
      if (plan.data_limit_mb && plan.data_limit_mb > 0) {
        const bytes = Math.round(plan.data_limit_mb * 1024 * 1024);
        body["transfer-limit"] = `${bytes}`;
      }
      await mikrotikRequest(router, "/ip/hotspot/user/profile/add", "POST", body);
    }
  }

  return { success: true, data: { message: "Plans synced successfully" } };
}

async function handleImportUsers(router: RouterConfig, supabase: ReturnType<typeof createClient>) {
  const result = await mikrotikRequest(router, "/ip/hotspot/user");
  if (!result.success) return result;

  const mikrotikUsers = result.data as Array<Record<string, string>>;
  let imported = 0, skipped = 0;

  for (const mUser of mikrotikUsers) {
    const username = mUser.name;
    if (!username || username === "default-trial") { skipped++; continue; }

    const { data: existing } = await supabase
      .from("radius_users")
      .select("id")
      .eq("username", username)
      .limit(1);

    if (existing && existing.length > 0) { skipped++; continue; }

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
  const result = await mikrotikRequest(router, "/ip/hotspot/user/profile");
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");

    const body = await req.json();
    const { action } = body;

    const publicActions = ["get-user-bandwidth"];
    const isPublicAction = publicActions.includes(action);

    let supabase: ReturnType<typeof createClient>;

    if (isPublicAction) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
    }

    const { router: routerConfig, username, password, profile, mac_address, service_type, expired_profile_name, locked, disabled, behavior } = body;

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
        result = await handleGetUserBandwidth(router!, username, supabase, body.radius_user_id, body.service_type);
        break;

      case "sync-user": {
        let syncPassword = password;
        if (!syncPassword && body.user_id) {
          const svcSupabase = createClient(supabaseUrl, supabaseServiceKey);
          const { data: pwdData } = await svcSupabase
            .from("radius_users")
            .select("password_hash")
            .eq("id", body.user_id)
            .single();
          syncPassword = pwdData?.password_hash;
        }
        if (!syncPassword) {
          result = { success: false, error: "Password required for sync" };
        } else {
          result = await handleSyncUser(router!, username, syncPassword, profile, mac_address, disabled);
        }
        break;
      }

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
        const sessions = await mikrotikRequest(router!, `/ip/hotspot/active?=user=${username}`);
        if (sessions.success && Array.isArray(sessions.data) && sessions.data.length > 0) {
          const session = sessions.data[0] as Record<string, string>;
          const detectedMac = session["mac-address"];
          if (detectedMac) {
            const existingUser = await mikrotikRequest(router!, `/ip/hotspot/user?=name=${username}`);
            if (existingUser.success && Array.isArray(existingUser.data) && existingUser.data.length > 0) {
              const userId = (existingUser.data[0] as Record<string, string>)[".id"];
              await mikrotikRequest(router!, `/ip/hotspot/user/${userId}`, "PATCH", { "mac-address": detectedMac });
              
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
    console.error('Mikrotik sync error:', err);
    return new Response(JSON.stringify({ success: false, error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
