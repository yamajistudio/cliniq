/**
 * Edge Function: process-whatsapp-message
 *
 * Processes a queued WhatsApp message event:
 *  1. Marks the webhook_event as PROCESSING
 *  2. Finds or creates a conversation
 *  3. Persists the inbound message
 *  4. Calls Claude Sonnet 4.6 for intent detection + action JSON
 *  5. Dispatches action (reply, schedule, escalate, etc.)
 *  6. Sends the outbound reply via WhatsApp Cloud API
 *  7. Records AI interaction for cost tracking
 *  8. Marks webhook_event as PROCESSED (or FAILED)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";

// ── Types ─────────────────────────────────────────────────────────────────────

type ProcessRequest = {
  webhook_event_id: string;
  clinic_id: string;
  phone_number_id: string;
};

type WhatsAppMessage = {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; filename?: string; caption?: string };
  audio?: { id: string; mime_type: string };
};

type IntentAction =
  | { type: "reply"; message: string }
  | { type: "schedule_appointment"; message: string; details?: Record<string, unknown> }
  | { type: "escalate"; message: string; reason: string }
  | { type: "collect_info"; message: string; fields: string[] }
  | { type: "provide_info"; message: string }
  | { type: "no_action" };

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um assistente de atendimento para uma clínica médica/odontológica.
Seu objetivo é ajudar pacientes com agendamentos, dúvidas gerais e direcionar casos urgentes.

Responda SEMPRE em português brasileiro de forma empática, clara e profissional.

Ao receber uma mensagem, analise a intenção do paciente e retorne um JSON com o seguinte formato:

{
  "intent": "<intent_label>",
  "confidence": <0.0 a 1.0>,
  "action": {
    "type": "<reply|schedule_appointment|escalate|collect_info|provide_info|no_action>",
    "message": "<mensagem para enviar ao paciente>",
    // campos adicionais dependendo do tipo:
    "reason": "<motivo do escalonamento — somente para type=escalate>",
    "details": { ... },        // somente para type=schedule_appointment
    "fields": ["campo1", ...]  // somente para type=collect_info
  }
}

Intenções possíveis: schedule_appointment, cancel_appointment, reschedule_appointment,
ask_price, ask_location, ask_hours, complaint, emergency, greeting, farewell, other.

Regras importantes:
- Para emergências médicas, SEMPRE use type=escalate com reason descrevendo a situação.
- Nunca confirme agendamentos sem coletar: nome, data desejada e tipo de serviço.
- Seja conciso. Máximo 3 parágrafos por resposta.
- Retorne APENAS o JSON, sem texto adicional.`;

// ── Send WhatsApp text message ────────────────────────────────────────────────

async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${errBody}` };
    }

    const data = await res.json() as { messages?: { id: string }[] };
    const externalId = data?.messages?.[0]?.id;
    return { success: true, externalId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: ProcessRequest;
  try {
    body = await req.json() as ProcessRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { webhook_event_id, clinic_id, phone_number_id } = body;

  if (!webhook_event_id || !clinic_id) {
    return new Response(
      JSON.stringify({ error: "webhook_event_id e clinic_id são obrigatórios" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── 1. Fetch and mark as PROCESSING ──────────────────────────────────────
  const { data: webhookEvent, error: fetchError } = await supabase
    .from("webhook_events")
    .select("id, payload, attempts, status")
    .eq("id", webhook_event_id)
    .single();

  if (fetchError || !webhookEvent) {
    console.error("[process-whatsapp-message] Evento não encontrado:", webhook_event_id);
    return new Response(JSON.stringify({ error: "Event not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!["PENDING", "FAILED"].includes(webhookEvent.status)) {
    // Already processed or currently being processed by another instance
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("webhook_events")
    .update({ status: "PROCESSING", attempts: (webhookEvent.attempts ?? 0) + 1 })
    .eq("id", webhook_event_id);

  // ── 2. Parse WhatsApp messages from payload ───────────────────────────────
  const waPaylod = webhookEvent.payload as Record<string, unknown>;
  const waMessages: WhatsAppMessage[] = Array.isArray(waPaylod.messages)
    ? (waPaylod.messages as WhatsAppMessage[])
    : [];

  if (waMessages.length === 0) {
    // Status update only, nothing to process
    await supabase
      .from("webhook_events")
      .update({ status: "PROCESSED", processed_at: new Date().toISOString() })
      .eq("id", webhook_event_id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const accessToken  = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

  if (!anthropicKey || !accessToken) {
    console.error("[process-whatsapp-message] Variáveis de ambiente faltando");
    await supabase
      .from("webhook_events")
      .update({ status: "FAILED", last_error: "Missing API keys" })
      .eq("id", webhook_event_id);

    return new Response(JSON.stringify({ error: "Configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  for (const msg of waMessages) {
    const startMs = Date.now();

    try {
      // Only handle text messages for now; media = friendly fallback
      const userText =
        msg.type === "text" && msg.text?.body
          ? msg.text.body
          : `[${msg.type === "image" ? "Imagem recebida" : msg.type === "audio" ? "Áudio recebido" : msg.type === "document" ? "Documento recebido" : "Mensagem recebida"}]`;

      // ── 3. Find or create conversation ─────────────────────────────────
      const { data: convRow, error: convError } = await supabase
        .from("conversations")
        .select("id, ai_context, status")
        .eq("clinic_id", clinic_id)
        .eq("channel", "WHATSAPP")
        .eq("contact_identifier", msg.from)
        .neq("status", "RESOLVED")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let conversationId: string;

      if (convError) throw convError;

      if (convRow) {
        conversationId = convRow.id;
      } else {
        const { data: newConv, error: createErr } = await supabase
          .from("conversations")
          .insert({
            clinic_id,
            channel: "WHATSAPP",
            contact_identifier: msg.from,
            contact_phone: msg.from,
            channel_metadata: { phone_number_id },
            status: "OPEN",
          })
          .select("id, ai_context, status")
          .single();

        if (createErr || !newConv) throw createErr ?? new Error("Failed to create conversation");
        conversationId = newConv.id;
      }

      // ── 4. Persist inbound message ──────────────────────────────────────
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        clinic_id,
        direction: "INBOUND",
        message_type: msg.type.toUpperCase() as "TEXT" | "IMAGE" | "DOCUMENT" | "AUDIO",
        content: msg.type === "text" ? msg.text?.body ?? null : null,
        payload: msg as Record<string, unknown>,
        external_message_id: msg.id,
        sent_by_ai: false,
        sent_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
      });

      // Update last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString(), status: "IN_PROGRESS" })
        .eq("id", conversationId);

      // ── 5. Fetch recent conversation history for context ────────────────
      const { data: recentMessages } = await supabase
        .from("messages")
        .select("direction, content, sent_by_ai, sent_at")
        .eq("conversation_id", conversationId)
        .order("sent_at", { ascending: false })
        .limit(10);

      const historyText = (recentMessages ?? [])
        .reverse()
        .filter((m) => m.content)
        .map((m) => `${m.direction === "INBOUND" ? "Paciente" : "Assistente"}: ${m.content}`)
        .join("\n");

      const userPrompt = historyText
        ? `Histórico recente:\n${historyText}\n\nNova mensagem do paciente: ${userText}`
        : `Mensagem do paciente: ${userText}`;

      // ── 6. Call Claude Sonnet 4.6 ───────────────────────────────────────
      const claudeResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const latencyMs = Date.now() - startMs;
      const rawContent = claudeResponse.content[0];
      const rawText = rawContent.type === "text" ? rawContent.text : "";

      // ── 7. Parse JSON action from LLM response ──────────────────────────
      let intentAction: IntentAction = { type: "reply", message: "Desculpe, ocorreu um erro. Tente novamente." };
      let intentLabel = "unknown";
      let confidence = 0;

      try {
        // Extract JSON from possible markdown code block
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ??
                          rawText.match(/(\{[\s\S]*\})/);
        const jsonStr = jsonMatch ? jsonMatch[1] : rawText;
        const parsed = JSON.parse(jsonStr.trim());

        intentLabel = parsed.intent ?? "unknown";
        confidence  = typeof parsed.confidence === "number" ? parsed.confidence : 0;
        intentAction = parsed.action as IntentAction;
      } catch (parseErr) {
        console.warn("[process-whatsapp-message] JSON parse error, using fallback:", parseErr);
      }

      // ── 8. Dispatch action ──────────────────────────────────────────────
      if (intentAction.type === "escalate") {
        await supabase
          .from("conversations")
          .update({
            status: "ESCALATED",
            ai_context: { escalation_reason: (intentAction as { reason?: string }).reason ?? "IA detectou necessidade de humano" },
          })
          .eq("id", conversationId);
      }

      const replyText =
        "message" in intentAction && intentAction.message
          ? intentAction.message
          : null;

      let outboundExternalId: string | undefined;
      let deliveryStatus = "PENDING";
      let sendError: string | null = null;

      if (replyText && intentAction.type !== "no_action") {
        const sendResult = await sendWhatsAppMessage(
          phone_number_id,
          accessToken,
          msg.from,
          replyText
        );

        if (sendResult.success) {
          outboundExternalId = sendResult.externalId;
          deliveryStatus = "SENT";
        } else {
          deliveryStatus = "FAILED";
          sendError = sendResult.error ?? "Unknown send error";
          console.error("[process-whatsapp-message] Erro ao enviar mensagem:", sendError);
        }

        // ── 9. Persist outbound message ─────────────────────────────────
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          clinic_id,
          direction: "OUTBOUND",
          message_type: "TEXT",
          content: replyText,
          external_message_id: outboundExternalId ?? null,
          sent_by_ai: true,
          delivery_status: deliveryStatus,
          error_details: sendError ? { message: sendError } : null,
        });

        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
      }

      // ── 10. Record AI interaction for cost tracking ─────────────────────
      const usage = claudeResponse.usage;
      await supabase.from("ai_interactions").insert({
        clinic_id,
        conversation_id: conversationId,
        model: "claude-sonnet-4-6",
        intent_detected: intentLabel,
        confidence_score: confidence,
        prompt_tokens: usage.input_tokens,
        completion_tokens: usage.output_tokens,
        action_taken: intentAction.type,
        action_payload: intentAction as Record<string, unknown>,
        escalated_to_human: intentAction.type === "escalate",
        escalation_reason:
          intentAction.type === "escalate"
            ? (intentAction as { reason?: string }).reason ?? null
            : null,
        latency_ms: latencyMs,
      });
    } catch (msgErr) {
      const errMsg = msgErr instanceof Error ? msgErr.message : String(msgErr);
      console.error(`[process-whatsapp-message] Erro ao processar msg ${msg.id}:`, errMsg);

      await supabase
        .from("webhook_events")
        .update({ status: "FAILED", last_error: errMsg })
        .eq("id", webhook_event_id);

      return new Response(JSON.stringify({ error: errMsg }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // ── 11. Mark webhook_event as PROCESSED ──────────────────────────────────
  await supabase
    .from("webhook_events")
    .update({ status: "PROCESSED", processed_at: new Date().toISOString() })
    .eq("id", webhook_event_id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
