import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/services/audit.service";
import type { Database } from "@/types/database";

// ── Types ────────────────────────────────────────────────────────────────────

type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"];
type ScheduleRow = Database["public"]["Tables"]["professional_schedules"]["Row"];

export type { ProfessionalRow, ScheduleRow };

export type ProfessionalWithSchedules = ProfessionalRow & {
  schedules: ScheduleRow[];
};

export type CreateProfessionalInput = {
  clinic_id: string;
  full_name: string;
  specialty: string;
  license_number?: string | null;
  phone?: string | null;
  email?: string | null;
  color?: string | null;
  user_id?: string | null;
};

export type UpdateProfessionalInput = {
  full_name?: string;
  specialty?: string;
  license_number?: string | null;
  phone?: string | null;
  email?: string | null;
  color?: string;
  avatar_url?: string | null;
  user_id?: string | null;
};

export type UpsertScheduleInput = {
  professional_id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_COLOR = "#3B82F6";

// Re-export from shared constants (safe for client import)
export { DAY_LABELS } from "@/lib/constants";

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

function validateColor(color: string | null | undefined): string {
  const raw = String(color ?? "").trim();
  if (!raw) return DEFAULT_COLOR;
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw;
  return DEFAULT_COLOR;
}

function validateTime(time: string | null | undefined): string | null {
  const raw = String(time ?? "").trim();
  if (!raw) return null;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) return raw.slice(0, 5);
  return null;
}

// ── List / Get ───────────────────────────────────────────────────────────────

export async function listProfessionals(
  clinicId: string,
  options?: { activeOnly?: boolean }
): Promise<ProfessionalRow[]> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return [];

  const supabase = createClient();
  let query = supabase
    .from("professionals")
    .select("*")
    .eq("clinic_id", safeClinicId)
    .order("full_name", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw serviceError(
      "Falha ao listar profissionais",
      error,
      "professionals.select"
    );
  }

  return (data ?? []) as ProfessionalRow[];
}

export async function getProfessionalById(
  professionalId: string,
  clinicId: string
): Promise<ProfessionalRow | null> {
  const safeId = String(professionalId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeId || !safeClinicId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .maybeSingle();

  if (error) {
    throw serviceError(
      "Falha ao buscar profissional",
      error,
      "professionals.selectById"
    );
  }

  return (data as ProfessionalRow | null) ?? null;
}

export async function getProfessionalWithSchedules(
  professionalId: string,
  clinicId: string
): Promise<ProfessionalWithSchedules | null> {
  const professional = await getProfessionalById(professionalId, clinicId);
  if (!professional) return null;

  const schedules = await listProfessionalSchedules(professionalId, clinicId);

  return { ...professional, schedules };
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createProfessional(
  payload: CreateProfessionalInput,
  userId: string
): Promise<ProfessionalRow> {
  const clinicId = String(payload.clinic_id ?? "").trim();
  const fullName = String(payload.full_name ?? "").trim();
  const specialty = String(payload.specialty ?? "").trim();

  if (!clinicId) throw new Error("Clínica não identificada.");
  if (!fullName) throw new Error("Informe o nome do profissional.");
  if (fullName.length < 2) throw new Error("Nome deve ter pelo menos 2 caracteres.");
  if (!specialty) throw new Error("Informe a especialidade do profissional.");

  // P1 Fix: enforce plan limit before creating
  const { enforcePlanLimit } = await import("@/services/plan-limits.service");
  await enforcePlanLimit(clinicId, "professionals");

  const color = validateColor(payload.color);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("professionals")
    .insert({
      clinic_id: clinicId,
      full_name: fullName,
      specialty,
      license_number: cleanNullable(payload.license_number),
      phone: cleanNullable(payload.phone),
      email: cleanNullable(payload.email),
      color,
      user_id: cleanNullable(payload.user_id),
    })
    .select("*")
    .single();

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      throw new Error("Já existe um profissional com este registro nesta clínica.");
    }
    throw serviceError(
      "Falha ao cadastrar profissional",
      error,
      "professionals.insert"
    );
  }

  await logAction(
    "create_professional",
    "professional",
    (data as ProfessionalRow).id,
    { full_name: fullName, specialty },
    userId,
    { softFail: true }
  );

  return data as ProfessionalRow;
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateProfessional(
  professionalId: string,
  clinicId: string,
  payload: UpdateProfessionalInput,
  userId: string
): Promise<ProfessionalRow> {
  const safeId = String(professionalId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeId || !safeClinicId) throw new Error("Profissional não identificado.");

  const existing = await getProfessionalById(safeId, safeClinicId);
  if (!existing) throw new Error("Profissional não encontrado nesta clínica.");

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.full_name !== undefined) {
    const name = String(payload.full_name).trim();
    if (!name || name.length < 2) throw new Error("Nome deve ter pelo menos 2 caracteres.");
    updateData.full_name = name;
  }
  if (payload.specialty !== undefined) {
    const spec = String(payload.specialty).trim();
    if (!spec) throw new Error("Informe a especialidade.");
    updateData.specialty = spec;
  }
  if (payload.license_number !== undefined) updateData.license_number = cleanNullable(payload.license_number);
  if (payload.phone !== undefined) updateData.phone = cleanNullable(payload.phone);
  if (payload.email !== undefined) updateData.email = cleanNullable(payload.email);
  if (payload.color !== undefined) updateData.color = validateColor(payload.color);
  if (payload.avatar_url !== undefined) updateData.avatar_url = cleanNullable(payload.avatar_url);
  if (payload.user_id !== undefined) updateData.user_id = cleanNullable(payload.user_id);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("professionals")
    .update(updateData)
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao atualizar profissional",
      error,
      "professionals.update"
    );
  }

  await logAction(
    "update_professional",
    "professional",
    safeId,
    { fields: Object.keys(updateData).filter((k) => k !== "updated_at") },
    userId,
    { softFail: true }
  );

  return data as ProfessionalRow;
}

// ── Toggle Active ────────────────────────────────────────────────────────────

export async function toggleProfessionalActive(
  professionalId: string,
  clinicId: string,
  userId: string
): Promise<ProfessionalRow> {
  const existing = await getProfessionalById(professionalId, clinicId);
  if (!existing) throw new Error("Profissional não encontrado.");

  const supabase = createClient();
  const newActive = !existing.is_active;

  const { data, error } = await supabase
    .from("professionals")
    .update({ is_active: newActive, updated_at: new Date().toISOString() })
    .eq("id", professionalId)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao alterar status do profissional",
      error,
      "professionals.toggleActive"
    );
  }

  await logAction(
    newActive ? "activate_professional" : "deactivate_professional",
    "professional",
    professionalId,
    { full_name: existing.full_name },
    userId,
    { softFail: true }
  );

  return data as ProfessionalRow;
}

// ── Schedules ────────────────────────────────────────────────────────────────

export async function listProfessionalSchedules(
  professionalId: string,
  clinicId: string
): Promise<ScheduleRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("professional_schedules")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("clinic_id", clinicId)
    .order("day_of_week", { ascending: true });

  if (error) {
    throw serviceError(
      "Falha ao listar horários",
      error,
      "professional_schedules.select"
    );
  }

  return (data ?? []) as ScheduleRow[];
}

export async function upsertProfessionalSchedule(
  input: UpsertScheduleInput
): Promise<ScheduleRow> {
  const professionalId = String(input.professional_id ?? "").trim();
  const clinicId = String(input.clinic_id ?? "").trim();
  const dayOfWeek = input.day_of_week;

  if (!professionalId || !clinicId) throw new Error("Dados obrigatórios ausentes.");
  if (dayOfWeek < 0 || dayOfWeek > 6) throw new Error("Dia da semana inválido.");

  const startTime = validateTime(input.start_time);
  const endTime = validateTime(input.end_time);
  if (!startTime || !endTime) throw new Error("Horários inválidos.");
  if (startTime >= endTime) throw new Error("Horário de início deve ser anterior ao término.");

  const slotDuration = Math.max(5, Math.min(240, input.slot_duration_minutes || 30));

  const supabase = createClient();

  // Tenta buscar registro existente
  const { data: existing } = await supabase
    .from("professional_schedules")
    .select("id")
    .eq("professional_id", professionalId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("professional_schedules")
      .update({
        start_time: startTime,
        end_time: endTime,
        slot_duration_minutes: slotDuration,
        is_active: input.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw serviceError("Falha ao atualizar horário", error, "schedules.update");
    }
    return data as ScheduleRow;
  }

  const { data, error } = await supabase
    .from("professional_schedules")
    .insert({
      professional_id: professionalId,
      clinic_id: clinicId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      slot_duration_minutes: slotDuration,
      is_active: input.is_active,
    })
    .select("*")
    .single();

  if (error) {
    throw serviceError("Falha ao criar horário", error, "schedules.insert");
  }

  return data as ScheduleRow;
}

export async function saveBulkSchedules(
  professionalId: string,
  clinicId: string,
  schedules: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
    is_active: boolean;
  }>
): Promise<ScheduleRow[]> {
  const results: ScheduleRow[] = [];

  for (const schedule of schedules) {
    const result = await upsertProfessionalSchedule({
      professional_id: professionalId,
      clinic_id: clinicId,
      ...schedule,
    });
    results.push(result);
  }

  return results;
}
