import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/services/audit.service";
import type { Database, PatientStatus, LeadSource } from "@/types/database";

// ── Types ────────────────────────────────────────────────────────────────────

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

export type { PatientRow };

export type CreatePatientInput = {
  clinic_id: string;
  full_name: string;
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  address?: string | null;
  notes?: string | null;
  source?: string | null;
};

export type UpdatePatientInput = {
  full_name?: string;
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  address?: string | null;
  notes?: string | null;
  source?: string | null;
  status?: PatientStatus;
};

export type PatientStats = {
  total: number;
  active: number;
  inactive: number;
  createdThisMonth: number;
};

export type PatientWithAppointments = PatientRow & {
  appointments: AppointmentRow[];
  lastAppointment: AppointmentRow | null;
  totalAppointments: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_PATIENT_STATUS: PatientStatus[] = ["ACTIVE", "INACTIVE"];
const VALID_SOURCES: LeadSource[] = [
  "WEBSITE", "INSTAGRAM", "WHATSAPP", "INDICACAO", "GOOGLE", "OUTRO",
];

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

function cleanDate(value: string | null | undefined): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function normalizeCpf(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) return raw;
  return digits;
}

function normalizeSource(value: string | null | undefined): LeadSource | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  return VALID_SOURCES.includes(normalized as LeadSource)
    ? (normalized as LeadSource)
    : null;
}

function normalizePatientStatus(value: string | null | undefined): PatientStatus | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  return VALID_PATIENT_STATUS.includes(normalized as PatientStatus)
    ? (normalized as PatientStatus)
    : null;
}

function validateEmail(email: string | null): void {
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email informado é inválido.");
  }
}

function validateRequiredFields(payload: CreatePatientInput) {
  const clinicId = String(payload.clinic_id ?? "").trim();
  const fullName = String(payload.full_name ?? "").trim();

  if (!clinicId) throw new Error("Clínica não identificada.");
  if (!fullName) throw new Error("Informe o nome completo do paciente.");
  if (fullName.length < 2) throw new Error("Nome deve ter pelo menos 2 caracteres.");
  if (fullName.length > 200) throw new Error("Nome muito longo (máx. 200 caracteres).");

  return { clinicId, fullName };
}

// ── List / Get ───────────────────────────────────────────────────────────────

export async function listPatients(
  clinicId: string,
  options?: {
    status?: PatientStatus;
    limit?: number;
    offset?: number;
    orderBy?: "full_name" | "created_at" | "updated_at";
    ascending?: boolean;
  }
): Promise<PatientRow[]> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return [];

  const {
    status,
    limit = 500,
    offset = 0,
    orderBy = "full_name",
    ascending = true,
  } = options ?? {};

  const supabase = createClient();
  let query = supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", safeClinicId)
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw serviceError("Falha ao listar pacientes", error, "patients.select");
  }

  return (data ?? []) as PatientRow[];
}

export async function getPatientById(
  patientId: string,
  clinicId: string
): Promise<PatientRow | null> {
  const safeId = String(patientId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeId || !safeClinicId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .maybeSingle();

  if (error) {
    throw serviceError("Falha ao buscar paciente", error, "patients.selectById");
  }

  return (data as PatientRow | null) ?? null;
}

export async function getPatientWithAppointments(
  patientId: string,
  clinicId: string
): Promise<PatientWithAppointments | null> {
  const patient = await getPatientById(patientId, clinicId);
  if (!patient) return null;

  const supabase = createClient();
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .eq("clinic_id", clinicId)
    .order("starts_at", { ascending: false });

  if (error) {
    throw serviceError(
      "Falha ao buscar agendamentos do paciente",
      error,
      "patients.selectAppointments"
    );
  }

  const appts = (appointments ?? []) as AppointmentRow[];

  return {
    ...patient,
    appointments: appts,
    lastAppointment: appts.length > 0 ? appts[0] : null,
    totalAppointments: appts.length,
  };
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createPatient(
  payload: CreatePatientInput,
  userId: string
): Promise<PatientRow> {
  const { clinicId, fullName } = validateRequiredFields(payload);

  // P1 Fix: enforce plan limit before creating
  const { enforcePlanLimit } = await import("@/services/plan-limits.service");
  await enforcePlanLimit(clinicId, "patients");

  const cpf = normalizeCpf(payload.cpf);
  const email = cleanNullable(payload.email);
  const phone = cleanNullable(payload.phone);
  const birthDate = cleanDate(payload.birth_date);
  const gender = cleanNullable(payload.gender);
  const address = cleanNullable(payload.address);
  const notes = cleanNullable(payload.notes);
  const source = normalizeSource(payload.source);

  validateEmail(email);

  const supabase = createClient();

  // Criptografa CPF em paralelo com a coluna plaintext (transição gradual)
  let cpfEncrypted: string | null = null;
  if (cpf) {
    try {
      const { data: encData } = await (supabase as any).rpc("crm_encrypt", { plaintext: cpf });
      cpfEncrypted = encData ?? null;
    } catch {
      // Chave de criptografia não configurada ainda — cpf_encrypted permanece null
    }
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({
      clinic_id: clinicId,
      full_name: fullName,
      cpf,
      cpf_encrypted: cpfEncrypted,
      email,
      phone,
      birth_date: birthDate,
      gender,
      address,
      notes,
      source,
      status: "ACTIVE" as PatientStatus,
      created_by: userId,
    } as any)
    .select("*")
    .single();

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      throw new Error("Já existe um paciente com este CPF nesta clínica.");
    }
    throw serviceError("Falha ao cadastrar paciente", error, "patients.insert");
  }

  await logAction(
    "create_patient",
    "patient",
    (data as PatientRow).id,
    { full_name: fullName, cpf, source },
    userId,
    { softFail: true }
  );

  return data as PatientRow;
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updatePatient(
  patientId: string,
  clinicId: string,
  payload: UpdatePatientInput,
  userId: string
): Promise<PatientRow> {
  const safeId = String(patientId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();

  if (!safeId || !safeClinicId) {
    throw new Error("Não foi possível identificar o paciente.");
  }

  const existing = await getPatientById(safeId, safeClinicId);
  if (!existing) {
    throw new Error("Paciente não encontrado nesta clínica.");
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.full_name !== undefined) {
    const name = String(payload.full_name).trim();
    if (!name || name.length < 2) {
      throw new Error("Nome deve ter pelo menos 2 caracteres.");
    }
    updateData.full_name = name;
  }
  if (payload.cpf !== undefined) {
    const normalizedCpf = normalizeCpf(payload.cpf);
    updateData.cpf = normalizedCpf;
    // Atualiza cpf_encrypted em paralelo
    if (normalizedCpf) {
      try {
        const supabaseForEnc = createClient();
        const { data: encData } = await (supabaseForEnc as any).rpc("crm_encrypt", { plaintext: normalizedCpf });
        updateData.cpf_encrypted = encData ?? null;
      } catch {
        // Chave de criptografia não configurada ainda — ignora
      }
    } else {
      updateData.cpf_encrypted = null;
    }
  }
  if (payload.email !== undefined) {
    const email = cleanNullable(payload.email);
    validateEmail(email);
    updateData.email = email;
  }
  if (payload.phone !== undefined) updateData.phone = cleanNullable(payload.phone);
  if (payload.birth_date !== undefined) updateData.birth_date = cleanDate(payload.birth_date);
  if (payload.gender !== undefined) updateData.gender = cleanNullable(payload.gender);
  if (payload.address !== undefined) updateData.address = cleanNullable(payload.address);
  if (payload.notes !== undefined) updateData.notes = cleanNullable(payload.notes);
  if (payload.source !== undefined) updateData.source = normalizeSource(payload.source);
  if (payload.status !== undefined) {
    const status = normalizePatientStatus(payload.status);
    if (!status) throw new Error("Status inválido.");
    updateData.status = status;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("patients")
    .update(updateData as any)
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .select("*")
    .single();

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      throw new Error("Já existe outro paciente com este CPF nesta clínica.");
    }
    throw serviceError("Falha ao atualizar paciente", error, "patients.update");
  }

  await logAction(
    "update_patient",
    "patient",
    safeId,
    { fields: Object.keys(updateData).filter((k) => k !== "updated_at") },
    userId,
    { softFail: true }
  );

  return data as PatientRow;
}

// ── Toggle Status / Delete ───────────────────────────────────────────────────

export async function togglePatientStatus(
  patientId: string,
  clinicId: string,
  userId: string
): Promise<PatientRow> {
  const existing = await getPatientById(patientId, clinicId);
  if (!existing) throw new Error("Paciente não encontrado.");

  const newStatus: PatientStatus =
    existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  return updatePatient(patientId, clinicId, { status: newStatus }, userId);
}

export async function deletePatient(
  patientId: string,
  clinicId: string,
  userId: string
): Promise<void> {
  const safeId = String(patientId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeId || !safeClinicId) throw new Error("Não foi possível identificar o paciente.");

  const existing = await getPatientById(safeId, safeClinicId);
  if (!existing) throw new Error("Paciente não encontrado nesta clínica.");

  const supabase = createClient();
  const { data: futureAppts } = await supabase
    .from("appointments")
    .select("id")
    .eq("patient_id", safeId)
    .eq("clinic_id", safeClinicId)
    .in("status", ["SCHEDULED", "CONFIRMED"])
    .limit(1);

  if (futureAppts && futureAppts.length > 0) {
    throw new Error(
      "Este paciente possui agendamentos futuros. Cancele os agendamentos antes de excluir."
    );
  }

  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() } as any)
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId);

  if (error) {
    throw serviceError("Falha ao excluir paciente", error, "patients.delete");
  }

  await logAction("delete_patient", "patient", safeId, { full_name: existing.full_name }, userId, { softFail: true });
}

// ── Search ───────────────────────────────────────────────────────────────────

export async function searchPatients(
  clinicId: string,
  query: string
): Promise<PatientRow[]> {
  const safeQuery = String(query ?? "").trim();
  if (!safeQuery) return listPatients(clinicId);

  const supabase = createClient();
  const searchTerm = `%${safeQuery}%`;
  const isDigitsOnly = /^\d+$/.test(safeQuery);

  let dbQuery = supabase.from("patients").select("*").eq("clinic_id", clinicId);

  if (isDigitsOnly) {
    dbQuery = dbQuery.or(`cpf.ilike.${searchTerm},phone.ilike.${searchTerm}`);
  } else {
    dbQuery = dbQuery.or(
      `full_name.ilike.${searchTerm},email.ilike.${searchTerm},cpf.ilike.${searchTerm},phone.ilike.${searchTerm}`
    );
  }

  const { data, error } = await dbQuery
    .order("full_name", { ascending: true })
    .limit(50);

  if (error) {
    throw serviceError("Falha ao buscar pacientes", error, "patients.search");
  }

  return (data ?? []) as PatientRow[];
}

// ── Stats ────────────────────────────────────────────────────────────────────

export async function getPatientStats(clinicId: string): Promise<PatientStats> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return { total: 0, active: 0, inactive: 0, createdThisMonth: 0 };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, status, created_at")
    .eq("clinic_id", safeClinicId);

  if (error) {
    throw serviceError("Falha ao calcular estatísticas", error, "patients.stats");
  }

  const patients = data ?? [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    total: patients.length,
    active: patients.filter((p) => p.status === "ACTIVE").length,
    inactive: patients.filter((p) => p.status === "INACTIVE").length,
    createdThisMonth: patients.filter(
      (p) => p.created_at && new Date(p.created_at) >= monthStart
    ).length,
  };
}
