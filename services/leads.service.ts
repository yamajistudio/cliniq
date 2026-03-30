import { createClient } from "@/lib/supabase/server";
import type { Database, LeadStatus, LeadSource } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export type CreateLeadInput = {
  clinic_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  source: LeadSource;
  notes?: string | null;
  assigned_to?: string | null;
};

export type UpdateLeadInput = {
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  source?: LeadSource;
  status?: LeadStatus;
  notes?: string | null;
  assigned_to?: string | null;
};

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

function cleanNullable(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function listLeads(clinicId: string): Promise<LeadRow[]> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("clinic_id", safeClinicId)
    .order("created_at", { ascending: false });

  if (error) {
    throw serviceError("Falha ao listar leads", error, "leads.select");
  }

  return (data ?? []) as LeadRow[];
}

export async function listLeadsByStatus(
  clinicId: string,
  status: LeadStatus
): Promise<LeadRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw serviceError("Falha ao filtrar leads", error, "leads.selectByStatus");
  }

  return (data ?? []) as LeadRow[];
}

export async function getLeadById(
  leadId: string,
  clinicId: string
): Promise<LeadRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) {
    throw serviceError("Falha ao buscar lead", error, "leads.selectById");
  }

  return (data as LeadRow | null) ?? null;
}

export async function createLead(
  payload: CreateLeadInput,
  userId: string
): Promise<LeadRow> {
  const clinicId = String(payload.clinic_id ?? "").trim();
  const fullName = String(payload.full_name ?? "").trim();

  if (!clinicId) throw new Error("Clínica não identificada.");
  if (!fullName) throw new Error("Informe o nome do lead.");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      clinic_id: clinicId,
      full_name: fullName,
      phone: cleanNullable(payload.phone),
      email: cleanNullable(payload.email),
      source: payload.source,
      notes: cleanNullable(payload.notes),
      assigned_to: cleanNullable(payload.assigned_to),
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw serviceError("Falha ao cadastrar lead", error, "leads.insert");
  }

  return data as LeadRow;
}

export async function updateLead(
  leadId: string,
  clinicId: string,
  payload: UpdateLeadInput
): Promise<LeadRow> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.full_name !== undefined)
    updateData.full_name = String(payload.full_name).trim();
  if (payload.phone !== undefined)
    updateData.phone = cleanNullable(payload.phone);
  if (payload.email !== undefined)
    updateData.email = cleanNullable(payload.email);
  if (payload.source !== undefined) updateData.source = payload.source;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.notes !== undefined)
    updateData.notes = cleanNullable(payload.notes);
  if (payload.assigned_to !== undefined)
    updateData.assigned_to = cleanNullable(payload.assigned_to);

  const { data, error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) {
    throw serviceError("Falha ao atualizar lead", error, "leads.update");
  }

  return data as LeadRow;
}

export async function deleteLead(
  leadId: string,
  clinicId: string
): Promise<void> {
  const safeId = String(leadId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeId || !safeClinicId) throw new Error("Não foi possível identificar o lead.");

  const existing = await getLeadById(safeId, safeClinicId);
  if (!existing) throw new Error("Lead não encontrado nesta clínica.");

  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ updated_at: new Date().toISOString(), deleted_at: new Date().toISOString() } as any)
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId);

  if (error) {
    throw serviceError("Falha ao excluir lead", error, "leads.delete");
  }
}

/**
 * Converte um lead em paciente de forma atômica via Edge Function.
 * A Edge Function `convert-lead-to-patient` executa a stored procedure
 * `convert_lead_to_patient_txn` (migration 010) que garante atomicidade:
 * se a criação do paciente ou atualização do lead falhar, nenhuma das
 * operações é persistida.
 */
export async function convertLeadToPatient(
  leadId: string,
  clinicId: string,
  // userId is resolved server-side by the Edge Function via auth.getUser()
  _userId: string
): Promise<{ patientId: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke<{ patientId: string }>(
    "convert-lead-to-patient",
    { body: { leadId, clinicId } }
  );

  if (error) {
    throw serviceError(
      "Falha ao converter lead em paciente",
      error,
      "leads.convertToPatient.edgeFunction"
    );
  }

  if (!data?.patientId) {
    throw new Error("Conversão concluída mas ID do paciente não retornado.");
  }

  return { patientId: data.patientId };
}
