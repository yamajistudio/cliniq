import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/services/audit.service";
import { isValidUuid } from "@/lib/validation/ids";
import type { Json } from "@/types/database";

// ── Types ────────────────────────────────────────────────────────────────────

export type ConversationChannel = "WHATSAPP" | "EMAIL" | "SMS" | "WEBCHAT";
export type ConversationStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_PATIENT"
  | "RESOLVED"
  | "ESCALATED";
export type MessageDirection = "INBOUND" | "OUTBOUND";
export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "DOCUMENT"
  | "AUDIO"
  | "TEMPLATE"
  | "INTERACTIVE"
  | "SYSTEM";

export type ConversationRow = {
  id: string;
  clinic_id: string;
  channel: ConversationChannel;
  contact_identifier: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  lead_id: string | null;
  patient_id: string | null;
  assigned_to: string | null;
  status: ConversationStatus;
  channel_metadata: Json;
  ai_context: Json;
  last_message_at: string | null;
  resolved_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  clinic_id: string;
  direction: MessageDirection;
  message_type: MessageType;
  content: string | null;
  payload: Json;
  external_message_id: string | null;
  sent_by_ai: boolean;
  sent_by_user_id: string | null;
  delivery_status: string | null;
  error_details: Json | null;
  sent_at: string;
  created_at: string;
};

export type FindOrCreateConversationInput = {
  clinic_id: string;
  channel: ConversationChannel;
  contact_identifier: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  channel_metadata?: Record<string, unknown>;
};

export type SaveMessageInput = {
  conversation_id: string;
  clinic_id: string;
  direction: MessageDirection;
  message_type?: MessageType;
  content?: string | null;
  payload?: Record<string, unknown>;
  external_message_id?: string | null;
  sent_by_ai?: boolean;
  sent_by_user_id?: string | null;
  delivery_status?: string;
};

export type ListConversationsOptions = {
  status?: ConversationStatus;
  channel?: ConversationChannel;
  assignedTo?: string | null;
  limit?: number;
  offset?: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function serviceError(base: string, raw: unknown, context: string) {
  const anyRaw = raw as { message?: string; code?: string } | null;
  const msg =
    raw instanceof Error
      ? raw.message
      : typeof anyRaw?.message === "string"
      ? anyRaw.message
      : typeof raw === "string"
      ? raw
      : JSON.stringify(raw);
  return new Error(`${base} [context: ${context}]: ${msg}`);
}

function cleanNullable(value: string | null | undefined): string | null {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

// ── findOrCreateConversation ──────────────────────────────────────────────────

/**
 * Returns an existing open/in-progress conversation for the contact or creates
 * a new one. Uses the unique partial index on (clinic_id, channel,
 * contact_identifier) where status != 'RESOLVED'.
 */
export async function findOrCreateConversation(
  input: FindOrCreateConversationInput
): Promise<ConversationRow> {
  const clinicId = String(input.clinic_id ?? "").trim();
  const contactIdentifier = String(input.contact_identifier ?? "").trim();

  if (!isValidUuid(clinicId)) {
    throw new Error("clinic_id inválido.");
  }
  if (!contactIdentifier) {
    throw new Error("contact_identifier é obrigatório.");
  }

  const supabase = createClient();

  // Try to find an existing active conversation
  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("channel", input.channel)
    .eq("contact_identifier", contactIdentifier)
    .neq("status", "RESOLVED")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) {
    throw serviceError("Erro ao buscar conversa", findError, "findOrCreateConversation");
  }

  if (existing) {
    return existing as ConversationRow;
  }

  // Create new conversation
  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({
      clinic_id: clinicId,
      channel: input.channel,
      contact_identifier: contactIdentifier,
      contact_name: cleanNullable(input.contact_name),
      contact_phone: cleanNullable(input.contact_phone),
      contact_email: cleanNullable(input.contact_email),
      channel_metadata: input.channel_metadata ?? {},
      status: "OPEN",
    })
    .select("*")
    .single();

  if (createError || !created) {
    throw serviceError("Erro ao criar conversa", createError, "findOrCreateConversation");
  }

  return created as ConversationRow;
}

// ── listConversations ─────────────────────────────────────────────────────────

export async function listConversations(
  clinicId: string,
  options: ListConversationsOptions = {}
): Promise<ConversationRow[]> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!isValidUuid(safeClinicId)) return [];

  const limit = Math.min(options.limit ?? 50, 200);
  const offset = options.offset ?? 0;

  const supabase = createClient();
  let query = supabase
    .from("conversations")
    .select("*")
    .eq("clinic_id", safeClinicId)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.channel) {
    query = query.eq("channel", options.channel);
  }
  if (options.assignedTo !== undefined) {
    if (options.assignedTo === null) {
      query = query.is("assigned_to", null);
    } else if (isValidUuid(options.assignedTo)) {
      query = query.eq("assigned_to", options.assignedTo);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw serviceError("Erro ao listar conversas", error, "listConversations");
  }

  return (data ?? []) as ConversationRow[];
}

// ── saveMessage ───────────────────────────────────────────────────────────────

export async function saveMessage(input: SaveMessageInput): Promise<MessageRow> {
  const conversationId = String(input.conversation_id ?? "").trim();
  const clinicId = String(input.clinic_id ?? "").trim();

  if (!isValidUuid(conversationId)) throw new Error("conversation_id inválido.");
  if (!isValidUuid(clinicId)) throw new Error("clinic_id inválido.");

  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      clinic_id: clinicId,
      direction: input.direction,
      message_type: input.message_type ?? "TEXT",
      content: cleanNullable(input.content),
      payload: input.payload ?? {},
      external_message_id: cleanNullable(input.external_message_id),
      sent_by_ai: input.sent_by_ai ?? false,
      sent_by_user_id: input.sent_by_user_id ?? null,
      delivery_status: input.delivery_status ?? (input.direction === "OUTBOUND" ? "PENDING" : null),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw serviceError("Erro ao salvar mensagem", error, "saveMessage");
  }

  // Update last_message_at on the conversation
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("clinic_id", clinicId);

  return data as MessageRow;
}

// ── escalateToHuman ───────────────────────────────────────────────────────────

export async function escalateToHuman(
  conversationId: string,
  clinicId: string,
  actorUserId: string,
  options?: {
    assignTo?: string | null;
    reason?: string | null;
  }
): Promise<ConversationRow> {
  const safeId = String(conversationId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  const safeActorId = String(actorUserId ?? "").trim();

  if (!isValidUuid(safeId)) throw new Error("conversation_id inválido.");
  if (!isValidUuid(safeClinicId)) throw new Error("clinic_id inválido.");
  if (!isValidUuid(safeActorId)) throw new Error("actorUserId inválido.");

  const supabase = createClient();

  // Fetch current conversation to merge ai_context
  const { data: current, error: fetchError } = await supabase
    .from("conversations")
    .select("ai_context, status")
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !current) {
    throw serviceError("Conversa não encontrada", fetchError, "escalateToHuman");
  }

  if (current.status === "RESOLVED") {
    throw new Error("Não é possível escalar uma conversa já resolvida.");
  }

  const currentContext =
    typeof current.ai_context === "object" && current.ai_context !== null
      ? (current.ai_context as Record<string, unknown>)
      : {};

  const mergedContext: Record<string, unknown> = {
    ...currentContext,
    escalated_at: new Date().toISOString(),
    escalation_reason: options?.reason ?? "Solicitação de atendimento humano",
    escalated_by: safeActorId,
  };

  const assignedTo =
    options?.assignTo !== undefined
      ? isValidUuid(String(options.assignTo ?? ""))
        ? options.assignTo
        : null
      : null;

  const { data: updated, error: updateError } = await supabase
    .from("conversations")
    .update({
      status: "ESCALATED",
      assigned_to: assignedTo,
      ai_context: mergedContext as Json,
    })
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw serviceError("Erro ao escalar conversa", updateError, "escalateToHuman");
  }

  await logAction(
    "escalate_conversation",
    "conversation",
    safeId,
    { reason: options?.reason ?? null, assigned_to: assignedTo },
    safeActorId,
    { softFail: true, clinicId: safeClinicId }
  );

  return updated as ConversationRow;
}

// ── resolveConversation ───────────────────────────────────────────────────────

export async function resolveConversation(
  conversationId: string,
  clinicId: string,
  actorUserId: string
): Promise<ConversationRow> {
  const safeId = String(conversationId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  const safeActorId = String(actorUserId ?? "").trim();

  if (!isValidUuid(safeId)) throw new Error("conversation_id inválido.");
  if (!isValidUuid(safeClinicId)) throw new Error("clinic_id inválido.");
  if (!isValidUuid(safeActorId)) throw new Error("actorUserId inválido.");

  const supabase = createClient();

  const { data: updated, error } = await supabase
    .from("conversations")
    .update({
      status: "RESOLVED",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .neq("status", "RESOLVED")
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !updated) {
    throw serviceError("Erro ao resolver conversa", error, "resolveConversation");
  }

  await logAction(
    "resolve_conversation",
    "conversation",
    safeId,
    {},
    safeActorId,
    { softFail: true, clinicId: safeClinicId }
  );

  return updated as ConversationRow;
}

// ── linkConversationToEntity ──────────────────────────────────────────────────

export async function linkConversationToEntity(
  conversationId: string,
  clinicId: string,
  entity: { leadId?: string | null; patientId?: string | null }
): Promise<void> {
  const safeId = String(conversationId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();

  if (!isValidUuid(safeId)) throw new Error("conversation_id inválido.");
  if (!isValidUuid(safeClinicId)) throw new Error("clinic_id inválido.");

  const patch: Record<string, string | null> = {};

  if (entity.leadId !== undefined) {
    patch.lead_id =
      entity.leadId && isValidUuid(entity.leadId) ? entity.leadId : null;
  }
  if (entity.patientId !== undefined) {
    patch.patient_id =
      entity.patientId && isValidUuid(entity.patientId) ? entity.patientId : null;
  }

  if (Object.keys(patch).length === 0) return;

  const supabase = createClient();

  const { error } = await supabase
    .from("conversations")
    .update(patch)
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .is("deleted_at", null);

  if (error) {
    throw serviceError("Erro ao vincular conversa", error, "linkConversationToEntity");
  }
}
