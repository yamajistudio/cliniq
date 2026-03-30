import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/services/audit.service";
import type { Json } from "@/types/database";

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Tipo unificado para prontuários.
 * Internamente lê/escreve em `medical_notes` (tabela unificada desde migration 009),
 * mas mantém a mesma interface pública para não quebrar o restante do código.
 */
export type MedicalRecordRow = {
  id: string;
  clinic_id: string;
  appointment_id: string;
  patient_id: string;
  professional_id: string | null;
  notes: string | null;
  diagnosis: string | null;
  prescription: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

// Row shape returned by Supabase for medical_notes
type MedicalNoteDbRow = {
  id: string;
  clinic_id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string;
  professional_id: string | null;
  content: Json;
  diagnosis: string | null;
  prescription: string | null;
  created_at: string | null;
  updated_at: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function serviceError(base: string, raw: unknown, ctx: string) {
  const anyRaw = raw as { message?: string } | null;
  const msg =
    raw instanceof Error
      ? raw.message
      : typeof anyRaw?.message === "string"
      ? anyRaw.message
      : JSON.stringify(raw);
  return new Error(`${base} [context: ${ctx}]: ${msg}`);
}

/** Extrai o campo `notes` do content JSONB de medical_notes. */
function extractNotes(content: Json | null): string | null {
  if (content === null || typeof content !== "object" || Array.isArray(content)) {
    return null;
  }
  const val = (content as Record<string, unknown>).notes;
  return typeof val === "string" && val.length > 0 ? val : null;
}

/** Mapeia uma row de medical_notes para o contrato MedicalRecordRow. */
function mapRow(row: MedicalNoteDbRow): MedicalRecordRow {
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    appointment_id: row.appointment_id ?? "",
    patient_id: row.patient_id,
    professional_id: row.professional_id,
    notes: extractNotes(row.content),
    diagnosis: row.diagnosis,
    prescription: row.prescription,
    created_by: row.doctor_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const COLUMNS =
  "id, clinic_id, appointment_id, patient_id, doctor_id, professional_id, content, diagnosis, prescription, created_at, updated_at" as const;

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getRecordByAppointment(
  appointmentId: string,
  clinicId: string
): Promise<MedicalRecordRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("medical_notes")
    .select(COLUMNS)
    .eq("appointment_id", appointmentId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) {
    throw serviceError("Falha ao buscar prontuário", error, "medical_notes.select");
  }

  return data ? mapRow(data as unknown as MedicalNoteDbRow) : null;
}

export async function listRecordsByPatient(
  patientId: string,
  clinicId: string
): Promise<MedicalRecordRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("medical_notes")
    .select(COLUMNS)
    .eq("patient_id", patientId)
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (error) {
    throw serviceError(
      "Falha ao listar prontuários",
      error,
      "medical_notes.selectByPatient"
    );
  }

  return (data ?? []).map((row) => mapRow(row as unknown as MedicalNoteDbRow));
}

// ── Upsert ───────────────────────────────────────────────────────────────────

export async function upsertMedicalRecord(
  input: {
    clinic_id: string;
    appointment_id: string;
    patient_id: string;
    professional_id?: string | null;
    notes?: string | null;
    diagnosis?: string | null;
    prescription?: string | null;
  },
  userId: string
): Promise<MedicalRecordRow> {
  const supabase = createClient();
  const existing = await getRecordByAppointment(
    input.appointment_id,
    input.clinic_id
  );

  const contentPayload: Json = { notes: input.notes ?? null };

  if (existing) {
    const { data, error } = await supabase
      .from("medical_notes")
      .update({
        content: contentPayload,
        diagnosis: input.diagnosis ?? null,
        prescription: input.prescription ?? null,
        professional_id: input.professional_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select(COLUMNS)
      .single();

    if (error) {
      throw serviceError(
        "Falha ao atualizar prontuário",
        error,
        "medical_notes.update"
      );
    }

    await logAction(
      "update_medical_record",
      "medical_record",
      existing.id,
      {},
      userId,
      { softFail: true }
    );

    return mapRow(data as unknown as MedicalNoteDbRow);
  }

  const { data, error } = await supabase
    .from("medical_notes")
    .insert({
      clinic_id: input.clinic_id,
      appointment_id: input.appointment_id,
      patient_id: input.patient_id,
      doctor_id: userId,
      professional_id: input.professional_id ?? null,
      content: contentPayload,
      diagnosis: input.diagnosis ?? null,
      prescription: input.prescription ?? null,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    throw serviceError("Falha ao criar prontuário", error, "medical_notes.insert");
  }

  const created = mapRow(data as unknown as MedicalNoteDbRow);

  await logAction(
    "create_medical_record",
    "medical_record",
    created.id,
    {},
    userId,
    { softFail: true }
  );

  return created;
}
