import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/ids";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TimeSlot = {
  slotStart: string;   // ISO timestamptz
  slotEnd:   string;
  isAvailable: boolean;
  professionalName?: string;
  serviceName?: string;
};

export type BookAppointmentParams = {
  clinicId:       string;
  patientId:      string;
  professionalId: string;
  serviceId:      string;
  startsAt:       string; // ISO timestamptz
  conversationId: string;
  leadId?:        string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function serviceError(base: string, raw: unknown, context: string) {
  const anyRaw = raw as { message?: string } | null;
  const msg =
    raw instanceof Error
      ? raw.message
      : typeof anyRaw?.message === "string"
      ? anyRaw.message
      : JSON.stringify(raw);
  return new Error(`${base} [context: ${context}]: ${msg}`);
}

// ── getAvailableSlots ─────────────────────────────────────────────────────────

/** Retorna todos os slots (disponíveis e ocupados) para um profissional na data. */
export async function getAvailableSlots(
  clinicId:               string,
  professionalId:         string,
  date:                   string, // YYYY-MM-DD
  serviceDurationMinutes: number = 30
): Promise<TimeSlot[]> {
  if (!isValidUuid(clinicId) || !isValidUuid(professionalId)) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];

  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_available_slots", {
    p_clinic_id:               clinicId,
    p_professional_id:         professionalId,
    p_date:                    date,
    p_service_duration_minutes: serviceDurationMinutes,
  });

  if (error) {
    throw serviceError("Erro ao buscar slots", error, "get_available_slots");
  }

  return (data ?? []).map(
    (s: { slot_start: string; slot_end: string; is_available: boolean }) => ({
      slotStart:   s.slot_start,
      slotEnd:     s.slot_end,
      isAvailable: s.is_available,
    })
  );
}

// ── getNextAvailableSlots ─────────────────────────────────────────────────────

/** Retorna os próximos N slots disponíveis. Usado pela IA para propor opções. */
export async function getNextAvailableSlots(
  clinicId:       string,
  professionalId: string,
  serviceId:      string,
  fromDate:       string = new Date().toISOString().split("T")[0],
  limit:          number = 3
): Promise<TimeSlot[]> {
  if (!isValidUuid(clinicId) || !isValidUuid(professionalId) || !isValidUuid(serviceId)) {
    return [];
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_next_available_slots", {
    p_clinic_id:       clinicId,
    p_professional_id: professionalId,
    p_service_id:      serviceId,
    p_from_date:       fromDate,
    p_limit:           limit,
  });

  if (error) {
    throw serviceError("Erro ao buscar próximos slots", error, "get_next_available_slots");
  }

  return (data ?? []).map(
    (s: {
      slot_start:        string;
      slot_end:          string;
      professional_name: string;
      service_name:      string;
    }) => ({
      slotStart:        s.slot_start,
      slotEnd:          s.slot_end,
      isAvailable:      true,
      professionalName: s.professional_name,
      serviceName:      s.service_name,
    })
  );
}

// ── bookAppointmentViaAI ──────────────────────────────────────────────────────

/** Agendamento transacional com verificação de conflito (anti-double-booking). */
export async function bookAppointmentViaAI(params: BookAppointmentParams): Promise<string> {
  if (!isValidUuid(params.clinicId))       throw new Error("clinic_id inválido.");
  if (!isValidUuid(params.patientId))      throw new Error("patient_id inválido.");
  if (!isValidUuid(params.professionalId)) throw new Error("professional_id inválido.");
  if (!isValidUuid(params.serviceId))      throw new Error("service_id inválido.");
  if (!isValidUuid(params.conversationId)) throw new Error("conversation_id inválido.");

  const supabase = createClient();

  const { data, error } = await supabase.rpc("book_appointment_ai", {
    p_clinic_id:       params.clinicId,
    p_patient_id:      params.patientId,
    p_professional_id: params.professionalId,
    p_service_id:      params.serviceId,
    p_starts_at:       params.startsAt,
    p_conversation_id: params.conversationId,
    p_lead_id:         params.leadId ?? null,
  });

  if (error) {
    throw serviceError("Erro ao agendar", error, "book_appointment_ai");
  }

  return data as string; // appointment UUID
}

// ── formatSlotsForWhatsApp ────────────────────────────────────────────────────

/** Formata uma lista de slots em texto legível para envio no WhatsApp. */
export function formatSlotsForWhatsApp(slots: TimeSlot[]): string {
  const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
  return slots
    .map((slot, i) => {
      const date = new Date(slot.slotStart);
      const dateStr = date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day:     "numeric",
        month:   "long",
      });
      const timeStr = date.toLocaleTimeString("pt-BR", {
        hour:   "2-digit",
        minute: "2-digit",
      });
      const professional = slot.professionalName ? ` com ${slot.professionalName}` : "";
      return `${emojis[i] ?? `${i + 1}.`} ${dateStr} às ${timeStr}${professional}`;
    })
    .join("\n");
}
