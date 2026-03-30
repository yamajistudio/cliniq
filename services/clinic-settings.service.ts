import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ClinicSettingsRow = Database["public"]["Tables"]["clinic_settings"]["Row"];
type ClinicSettingsInsert =
  Database["public"]["Tables"]["clinic_settings"]["Insert"];

export type { ClinicSettingsRow };

export type UpdateClinicSettingsInput = {
  opening_time?: string;
  closing_time?: string;
  slot_duration_minutes?: number;
  days_open?: number[];
  lunch_start?: string | null;
  lunch_end?: string | null;
  allow_online_booking?: boolean;
  timezone?: string;
  appointment_buffer_minutes?: number;
};

// Re-export from shared constants (safe for client import)
export { DAY_NAMES } from "@/lib/constants";

const DEFAULTS: Omit<ClinicSettingsRow, "id" | "clinic_id" | "updated_at"> = {
  opening_time: "08:00",
  closing_time: "18:00",
  slot_duration_minutes: 30,
  days_open: [1, 2, 3, 4, 5],
  lunch_start: null,
  lunch_end: null,
  allow_online_booking: false,
  timezone: "America/Sao_Paulo",
  appointment_buffer_minutes: 0,
};

function serviceError(base: string, raw: unknown, context: string) {
  const msg =
    raw instanceof Error
      ? raw.message
      : typeof (raw as any)?.message === "string"
      ? (raw as any).message
      : JSON.stringify(raw);

  return new Error(`${base} [context: ${context}]: ${msg}`);
}

function validateTime(time: string | undefined): string | null {
  if (!time) return null;

  const trimmed = time.trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    return trimmed.slice(0, 5);
  }

  return null;
}

// ── Get (auto-creates default if missing) ────────────────────────────────────

export async function getClinicSettings(
  clinicId: string
): Promise<ClinicSettingsRow> {
  const safeClinicId = String(clinicId ?? "").trim();

  if (!safeClinicId) {
    return {
      id: "",
      clinic_id: "",
      ...DEFAULTS,
      updated_at: null,
    };
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("clinic_settings")
    .select("*")
    .eq("clinic_id", safeClinicId)
    .maybeSingle();

  if (error) {
    throw serviceError(
      "Falha ao buscar configurações",
      error,
      "clinic_settings.select"
    );
  }

  if (data) {
    return data as ClinicSettingsRow;
  }

  const { data: created, error: createError } = await supabase
    .from("clinic_settings")
    .insert({ clinic_id: safeClinicId })
    .select("*")
    .single();

  if (createError) {
    return {
      id: "",
      clinic_id: safeClinicId,
      ...DEFAULTS,
      updated_at: null,
    };
  }

  return created as ClinicSettingsRow;
}

// ── Upsert ───────────────────────────────────────────────────────────────────

export async function upsertClinicSettings(
  clinicId: string,
  input: UpdateClinicSettingsInput
): Promise<ClinicSettingsRow> {
  const safeClinicId = String(clinicId ?? "").trim();

  if (!safeClinicId) {
    throw new Error("Clínica não identificada.");
  }

  const opening = validateTime(input.opening_time);
  const closing = validateTime(input.closing_time);

  if (opening && closing && opening >= closing) {
    throw new Error("Horário de abertura deve ser anterior ao de fechamento.");
  }

  const lunchStart = validateTime(input.lunch_start ?? undefined);
  const lunchEnd = validateTime(input.lunch_end ?? undefined);

  if ((lunchStart && !lunchEnd) || (!lunchStart && lunchEnd)) {
    throw new Error(
      "Informe início e fim do intervalo, ou deixe ambos em branco."
    );
  }

  if (lunchStart && lunchEnd && lunchStart >= lunchEnd) {
    throw new Error("Início do intervalo deve ser anterior ao fim.");
  }

  const slotDuration =
    input.slot_duration_minutes !== undefined
      ? Math.max(5, Math.min(240, input.slot_duration_minutes))
      : undefined;

  const daysOpen = input.days_open?.filter(
    (d) => Number.isInteger(d) && d >= 0 && d <= 6
  );

  const bufferMinutes =
    input.appointment_buffer_minutes !== undefined
      ? Math.max(0, Math.min(60, input.appointment_buffer_minutes))
      : undefined;

  const payload: ClinicSettingsInsert = {
    clinic_id: safeClinicId,
  };

  if (opening !== null) {
    payload.opening_time = opening;
  }

  if (closing !== null) {
    payload.closing_time = closing;
  }

  if (slotDuration !== undefined) {
    payload.slot_duration_minutes = slotDuration;
  }

  if (daysOpen !== undefined && daysOpen.length > 0) {
    payload.days_open = daysOpen;
  }

  if (input.lunch_start !== undefined) {
    payload.lunch_start = lunchStart;
  }

  if (input.lunch_end !== undefined) {
    payload.lunch_end = lunchEnd;
  }

  if (input.allow_online_booking !== undefined) {
    payload.allow_online_booking = input.allow_online_booking;
  }

  if (input.timezone !== undefined) {
    payload.timezone = input.timezone.trim() || "America/Sao_Paulo";
  }

  if (bufferMinutes !== undefined) {
    payload.appointment_buffer_minutes = bufferMinutes;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("clinic_settings")
    .upsert(payload, { onConflict: "clinic_id" })
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao salvar configurações",
      error,
      "clinic_settings.upsert"
    );
  }

  return data as ClinicSettingsRow;
}
