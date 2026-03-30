import { createClient } from "@/lib/supabase/server";
import type { Database, AppointmentStatus } from "@/types/database";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

export type CreateAppointmentInput = {
  clinic_id: string;
  patient_id: string;
  professional_id?: string | null;
  doctor_id?: string | null;
  service_id?: string | null;
  starts_at: string;
  ends_at?: string | null;
  notes?: string | null;
};

export type UpdateAppointmentInput = {
  patient_id?: string;
  professional_id?: string | null;
  doctor_id?: string | null;
  service_id?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  status?: AppointmentStatus;
  notes?: string | null;
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

function cleanNullable(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function listAppointments(
  clinicId: string
): Promise<AppointmentRow[]> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", safeClinicId)
    .order("starts_at", { ascending: true });

  if (error) {
    throw serviceError(
      "Falha ao listar agendamentos",
      error,
      "appointments.select"
    );
  }

  return (data ?? []) as AppointmentRow[];
}

export async function listAppointmentsByDate(
  clinicId: string,
  date: string
): Promise<AppointmentRow[]> {
  const supabase = createClient();
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId)
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd)
    .order("starts_at", { ascending: true });

  if (error) {
    throw serviceError(
      "Falha ao listar agendamentos do dia",
      error,
      "appointments.selectByDate"
    );
  }

  return (data ?? []) as AppointmentRow[];
}

export async function listAppointmentsByDoctor(
  clinicId: string,
  doctorId: string
): Promise<AppointmentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("doctor_id", doctorId)
    .order("starts_at", { ascending: true });

  if (error) {
    throw serviceError(
      "Falha ao listar agendamentos do médico",
      error,
      "appointments.selectByDoctor"
    );
  }

  return (data ?? []) as AppointmentRow[];
}

export async function listAppointmentsByProfessional(
  clinicId: string,
  professionalId: string
): Promise<AppointmentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("professional_id", professionalId)
    .order("starts_at", { ascending: true });

  if (error) {
    throw serviceError(
      "Falha ao listar agendamentos do profissional",
      error,
      "appointments.selectByProfessional"
    );
  }

  return (data ?? []) as AppointmentRow[];
}

export async function listAppointmentsByDateAndProfessional(
  clinicId: string,
  date: string,
  professionalId?: string | null
): Promise<AppointmentRow[]> {
  const supabase = createClient();
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  let query = supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId)
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd)
    .order("starts_at", { ascending: true });

  if (professionalId) {
    query = query.eq("professional_id", professionalId);
  }

  const { data, error } = await query;

  if (error) {
    throw serviceError(
      "Falha ao listar agendamentos filtrados",
      error,
      "appointments.selectByDateProfessional"
    );
  }

  return (data ?? []) as AppointmentRow[];
}

export async function getAppointmentById(
  appointmentId: string,
  clinicId: string
): Promise<AppointmentRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) {
    throw serviceError(
      "Falha ao buscar agendamento",
      error,
      "appointments.selectById"
    );
  }

  return (data as AppointmentRow | null) ?? null;
}

export async function createAppointment(
  payload: CreateAppointmentInput,
  userId: string
): Promise<AppointmentRow> {
  const clinicId = String(payload.clinic_id ?? "").trim();
  const patientId = String(payload.patient_id ?? "").trim();
  const startsAt = String(payload.starts_at ?? "").trim();

  if (!clinicId) throw new Error("Clínica não identificada.");
  if (!patientId) throw new Error("Selecione o paciente.");
  if (!startsAt) throw new Error("Informe a data e hora do agendamento.");

  // P1 Fix: enforce plan limit before creating
  const { enforcePlanLimit } = await import("@/services/plan-limits.service");
  await enforcePlanLimit(clinicId, "appointments_month");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      professional_id: cleanNullable(payload.professional_id),
      doctor_id: cleanNullable(payload.doctor_id),
      service_id: cleanNullable(payload.service_id),
      starts_at: startsAt,
      ends_at: cleanNullable(payload.ends_at),
      notes: cleanNullable(payload.notes),
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao criar agendamento",
      error,
      "appointments.insert"
    );
  }

  return data as AppointmentRow;
}

export async function updateAppointment(
  appointmentId: string,
  clinicId: string,
  payload: UpdateAppointmentInput
): Promise<AppointmentRow> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.patient_id !== undefined) updateData.patient_id = payload.patient_id;
  if (payload.professional_id !== undefined) updateData.professional_id = cleanNullable(payload.professional_id);
  if (payload.doctor_id !== undefined) updateData.doctor_id = cleanNullable(payload.doctor_id);
  if (payload.service_id !== undefined) updateData.service_id = cleanNullable(payload.service_id);
  if (payload.starts_at !== undefined) updateData.starts_at = payload.starts_at;
  if (payload.ends_at !== undefined) updateData.ends_at = cleanNullable(payload.ends_at);
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.notes !== undefined) updateData.notes = cleanNullable(payload.notes);

  const { data, error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", appointmentId)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao atualizar agendamento",
      error,
      "appointments.update"
    );
  }

  return data as AppointmentRow;
}

// ── Week View (Sprint 3) ─────────────────────────────────────────────────────

export async function listAppointmentsByWeek(
  clinicId: string,
  weekStartDate: string,
  professionalId?: string | null
): Promise<AppointmentRow[]> {
  const supabase = createClient();
  const weekStart = `${weekStartDate}T00:00:00`;
  const weekEndDate = new Date(weekStartDate + "T12:00:00");
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEnd = `${weekEndDate.toISOString().slice(0, 10)}T23:59:59`;

  let query = supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId)
    .gte("starts_at", weekStart)
    .lte("starts_at", weekEnd)
    .order("starts_at", { ascending: true });

  if (professionalId) {
    query = query.eq("professional_id", professionalId);
  }

  const { data, error } = await query;

  if (error) {
    throw serviceError(
      "Falha ao listar agendamentos da semana",
      error,
      "appointments.selectByWeek"
    );
  }

  return (data ?? []) as AppointmentRow[];
}

export function groupAppointmentsByDate(
  appointments: AppointmentRow[]
): Record<string, AppointmentRow[]> {
  const grouped: Record<string, AppointmentRow[]> = {};
  for (const appt of appointments) {
    const date = appt.starts_at.slice(0, 10);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(appt);
  }
  return grouped;
}

export function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const d = new Date(startDate + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function getMonday(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function cancelAppointment(
  appointmentId: string,
  clinicId: string
): Promise<AppointmentRow> {
  return updateAppointment(appointmentId, clinicId, { status: "CANCELLED" });
}

// ── Status Transitions (Sprint 2) ───────────────────────────────────────────

import { APPOINTMENT_FLOW } from "@/lib/status";
import { logStatusTransition } from "@/services/appointment-history.service";

export async function changeAppointmentStatus(
  appointmentId: string,
  clinicId: string,
  newStatus: AppointmentStatus,
  userId: string,
  reason?: string | null
): Promise<AppointmentRow> {
  const safeId = String(appointmentId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeId || !safeClinicId) throw new Error("Agendamento não identificado.");

  const existing = await getAppointmentById(safeId, safeClinicId);
  if (!existing) throw new Error("Agendamento não encontrado.");

  const currentStatus = existing.status as AppointmentStatus;
  const allowedTransitions = APPOINTMENT_FLOW[currentStatus] ?? [];

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Não é possível mudar de "${currentStatus}" para "${newStatus}".`
    );
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // Se confirmando, seta confirmed_at/by
  if (newStatus === "CONFIRMED") {
    updateData.confirmed_at = new Date().toISOString();
    updateData.confirmed_by = userId;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao mudar status do agendamento",
      error,
      "appointments.changeStatus"
    );
  }

  // Registrar no histórico
  await logStatusTransition(
    safeId,
    safeClinicId,
    currentStatus,
    newStatus,
    userId,
    reason
  );

  return data as AppointmentRow;
}

export async function confirmAppointment(
  appointmentId: string,
  clinicId: string,
  userId: string
): Promise<AppointmentRow> {
  return changeAppointmentStatus(
    appointmentId,
    clinicId,
    "CONFIRMED",
    userId
  );
}
