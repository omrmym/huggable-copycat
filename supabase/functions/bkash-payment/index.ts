import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BkashTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  statusCode: string;
  statusMessage: string;
}

async function getToken(baseUrl: string, appKey: string, appSecret: string, username: string, password: string): Promise<string> {
  const res = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username,
      password,
    },
    body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
  });
  const data: BkashTokenResponse = await res.json();
  if (data.statusCode !== "0000") {
    throw new Error(data.statusMessage || "Failed to get bKash token");
  }
  return data.id_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load bKash config from app_settings
    const { data: config } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "payment_gateway")
      .maybeSingle();

    const settings = config?.value as Record<string, any> | null;
    if (!settings?.bkash_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: "bKash payment is not enabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appKey = settings.bkash_app_key;
    const appSecret = settings.bkash_app_secret;
    const bkashUsername = settings.bkash_username;
    const bkashPassword = settings.bkash_password;
    const isSandbox = settings.bkash_sandbox === true; // default to production

    if (!appKey || !appSecret || !bkashUsername || !bkashPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "bKash credentials not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = isSandbox
      ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
      : "https://tokenized.pay.bka.sh/v1.2.0-beta";

    const body = await req.json();
    const { action } = body;

    // Get bKash token
    const idToken = await getToken(baseUrl, appKey, appSecret, bkashUsername, bkashPassword);

    const bkashHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: idToken,
      "X-APP-Key": appKey,
    };

    if (action === "create") {
      const { amount, userId, description, callbackURL } = body;

      if (!amount || !userId || !callbackURL) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const invoiceNumber = `INV-${Date.now()}`;

      const res = await fetch(`${baseUrl}/tokenized/checkout/create`, {
        method: "POST",
        headers: bkashHeaders,
        body: JSON.stringify({
          mode: "0011",
          payerReference: userId,
          callbackURL,
          amount: amount.toString(),
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: invoiceNumber,
        }),
      });

      const data = await res.json();

      if (data.statusCode === "0000" && data.bkashURL) {
        return new Response(
          JSON.stringify({
            success: true,
            paymentID: data.paymentID,
            bkashURL: data.bkashURL,
            invoiceNumber,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: data.statusMessage || "Payment creation failed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "execute") {
      const { paymentID, userId, amount } = body;

      if (!paymentID) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing paymentID" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
        method: "POST",
        headers: bkashHeaders,
        body: JSON.stringify({ paymentID }),
      });

      const data = await res.json();

      if (data.statusCode === "0000" && data.transactionStatus === "Completed") {
        // Record the transaction
        const paidAmount = parseFloat(data.amount || amount);
        
        await supabase.from("transactions").insert({
          radius_user_id: userId,
          amount: paidAmount,
          type: "payment",
          status: "approved",
          payment_method: "bKash",
          description: `bKash payment - TrxID: ${data.trxID}`,
        });

        return new Response(
          JSON.stringify({
            success: true,
            transactionId: data.trxID,
            amount: data.amount,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: data.statusMessage || "Payment execution failed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "query") {
      const { paymentID } = body;

      const res = await fetch(`${baseUrl}/tokenized/checkout/payment/status`, {
        method: "POST",
        headers: bkashHeaders,
        body: JSON.stringify({ paymentID }),
      });

      const data = await res.json();

      return new Response(
        JSON.stringify({ success: true, ...data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
