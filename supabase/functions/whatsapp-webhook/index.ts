/**
 * Edge Function: whatsapp-webhook
 *
 * Receives events from the Meta WhatsApp Business API.
 *
 * GET  → webhook challenge verification (hub.challenge handshake)
 * POST → incoming message / status update
 *        - Verifies HMAC-SHA256 signature (x-hub-signature-256)
 *        - Routes each entry to the correct clinic via phone_number_id
 *        - Enqueues event in webhook_events for async processing
 *        - Fire-and-forgets process-whatsapp-message for each message event
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── HMAC-SHA256 verification ──────────────────────────────────────────────────

async function verifySignature(
  rawBody: Uint8Array,
  signatureHeader: string | null,
  appSecret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;

  const receivedHex = signatureHeader.slice(prefix.length);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const computedBuffer = await crypto.subtle.sign("HMAC", key, rawBody);
  const computedHex = Array.from(new Uint8Array(computedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  if (receivedHex.length !== computedHex.length) return false;

  let diff = 0;
  for (let i = 0; i < receivedHex.length; i++) {
    diff |= receivedHex.charCodeAt(i) ^ computedHex.charCodeAt(i);
  }
  return diff === 0;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const url = new URL(req.url);

  // ── GET: webhook challenge verification ────────────────────────────────────
  if (req.method === "GET") {
    const mode      = url.searchParams.get("hub.mode");
    const token     = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return jsonResponse({ error: "Forbidden" }, 403);
  }

  // ── POST: incoming webhook event ───────────────────────────────────────────
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!appSecret) {
    console.error("[whatsapp-webhook] WHATSAPP_APP_SECRET não configurado");
    return jsonResponse({ error: "Internal configuration error" }, 500);
  }

  // Read body once; we need the raw bytes for HMAC and the text for JSON
  const rawBody = new Uint8Array(await req.arrayBuffer());
  const signatureHeader = req.headers.get("x-hub-signature-256");

  const isValid = await verifySignature(rawBody, signatureHeader, appSecret);
  if (!isValid) {
    console.warn("[whatsapp-webhook] Assinatura inválida rejeitada");
    return jsonResponse({ error: "Invalid signature" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  // Only handle WhatsApp Business Account events
  if (payload.object !== "whatsapp_business_account") {
    return jsonResponse({ ok: true }); // acknowledge but ignore
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change?.value as Record<string, unknown> | undefined;
      if (!value) continue;

      // phone_number_id identifies which clinic this event belongs to
      const phoneNumberId =
        (value?.metadata as Record<string, unknown>)?.phone_number_id as
          | string
          | undefined;

      if (!phoneNumberId) continue;

      // ── Resolve clinic_id from phone_number_id ──────────────────────────
      const { data: settingsRow } = await supabase
        .from("clinic_settings")
        .select("clinic_id")
        .eq("whatsapp_phone_number_id", phoneNumberId)
        .eq("whatsapp_enabled", true)
        .maybeSingle();

      const clinicId = settingsRow?.clinic_id ?? null;

      // Determine event_type
      const hasMessages = Array.isArray(value.messages) && value.messages.length > 0;
      const hasStatuses = Array.isArray(value.statuses) && value.statuses.length > 0;
      const eventType = hasMessages ? "message" : hasStatuses ? "status_update" : "other";

      // ── Enqueue in webhook_events ───────────────────────────────────────
      const { data: eventRow, error: insertError } = await supabase
        .from("webhook_events")
        .insert({
          clinic_id: clinicId,
          channel: "WHATSAPP",
          channel_account_id: phoneNumberId,
          event_type: eventType,
          payload: value as Record<string, unknown>,
          status: "PENDING",
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(
          "[whatsapp-webhook] Erro ao inserir webhook_event:",
          insertError.message
        );
        continue;
      }

      // ── Fire-and-forget: process message events only ────────────────────
      if (eventType === "message" && clinicId && eventRow?.id) {
        const processorUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-whatsapp-message`;

        fetch(processorUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            webhook_event_id: eventRow.id,
            clinic_id: clinicId,
            phone_number_id: phoneNumberId,
          }),
        }).catch((err: unknown) => {
          // Non-blocking — processor will retry via PENDING queue
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[whatsapp-webhook] Fire-and-forget error:", msg);
        });
      }
    }
  }

  // Meta expects a 200 OK quickly; all processing is async
  return jsonResponse({ ok: true });
});
