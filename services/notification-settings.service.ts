import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type NotificationSettingsRow =
  Database["public"]["Tables"]["notification_settings"]["Row"];
type NotificationSettingsInsert =
  Database["public"]["Tables"]["notification_settings"]["Insert"];

export type { NotificationSettingsRow };

export type UpdateNotificationSettingsInput = {
  confirm_enabled?: boolean;
  confirm_hours_before?: number;
  confirm_channel?: string;
  reminder_enabled?: boolean;
  reminder_hours_before?: number;
  reminder_channel?: string;
  followup_enabled?: boolean;
  followup_days_after?: number;
  followup_channel?: string;
  birthday_enabled?: boolean;
};

const DEFAULTS: Omit<
  NotificationSettingsRow,
  "id" | "clinic_id" | "updated_at"
> = {
  confirm_enabled: true,
  confirm_hours_before: 24,
  confirm_channel: "WHATSAPP",
  reminder_enabled: true,
  reminder_hours_before: 2,
  reminder_channel: "WHATSAPP",
  followup_enabled: false,
  followup_days_after: 7,
  followup_channel: "WHATSAPP",
  birthday_enabled: false,
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

function normalizeChannel(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toUpperCase();

  if (!normalized) return undefined;

  const allowed = ["WHATSAPP", "EMAIL", "SMS"];
  return allowed.includes(normalized) ? normalized : "WHATSAPP";
}

function clamp(value: number | undefined, min: number, max: number) {
  if (value === undefined) return undefined;
  return Math.max(min, Math.min(max, value));
}

// ── Get (auto-creates default if missing) ────────────────────────────────────

export async function getNotificationSettings(
  clinicId: string
): Promise<NotificationSettingsRow> {
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
    .from("notification_settings")
    .select("*")
    .eq("clinic_id", safeClinicId)
    .maybeSingle();

  if (error) {
    throw serviceError(
      "Falha ao buscar notificações",
      error,
      "notification_settings.select"
    );
  }

  if (data) {
    return data as NotificationSettingsRow;
  }

  const { data: created, error: createError } = await supabase
    .from("notification_settings")
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

  return created as NotificationSettingsRow;
}

// ── Upsert ───────────────────────────────────────────────────────────────────

export async function upsertNotificationSettings(
  clinicId: string,
  input: UpdateNotificationSettingsInput
): Promise<NotificationSettingsRow> {
  const safeClinicId = String(clinicId ?? "").trim();

  if (!safeClinicId) {
    throw new Error("Clínica não identificada.");
  }

  const confirmHours = clamp(input.confirm_hours_before, 1, 168);
  const reminderHours = clamp(input.reminder_hours_before, 1, 168);
  const followupDays = clamp(input.followup_days_after, 1, 365);

  const payload: NotificationSettingsInsert = {
    clinic_id: safeClinicId,
  };

  if (input.confirm_enabled !== undefined) {
    payload.confirm_enabled = input.confirm_enabled;
  }

  if (confirmHours !== undefined) {
    payload.confirm_hours_before = confirmHours;
  }

  const confirmChannel = normalizeChannel(input.confirm_channel);
  if (confirmChannel !== undefined) {
    payload.confirm_channel = confirmChannel;
  }

  if (input.reminder_enabled !== undefined) {
    payload.reminder_enabled = input.reminder_enabled;
  }

  if (reminderHours !== undefined) {
    payload.reminder_hours_before = reminderHours;
  }

  const reminderChannel = normalizeChannel(input.reminder_channel);
  if (reminderChannel !== undefined) {
    payload.reminder_channel = reminderChannel;
  }

  if (input.followup_enabled !== undefined) {
    payload.followup_enabled = input.followup_enabled;
  }

  if (followupDays !== undefined) {
    payload.followup_days_after = followupDays;
  }

  const followupChannel = normalizeChannel(input.followup_channel);
  if (followupChannel !== undefined) {
    payload.followup_channel = followupChannel;
  }

  if (input.birthday_enabled !== undefined) {
    payload.birthday_enabled = input.birthday_enabled;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("notification_settings")
    .upsert(payload, { onConflict: "clinic_id" })
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao salvar notificações",
      error,
      "notification_settings.upsert"
    );
  }

  return data as NotificationSettingsRow;
}
