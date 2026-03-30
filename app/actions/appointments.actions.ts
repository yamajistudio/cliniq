"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import {
  createAppointment,
  changeAppointmentStatus,
  confirmAppointment,
} from "@/services/appointments.service";
import type { AppointmentStatus } from "@/types/database";
import { validateUuid } from "@/lib/validation/ids";
import { deleteLimiter } from "@/lib/rate-limit";

function requireClinicId(clinicId: string | null): string {
  if (!clinicId) throw new Error("Você não está vinculado a nenhuma clínica.");
  return clinicId;
}

function readString(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createAppointmentAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const patientId = readString(formData, "patient_id");
  const startsAt = readString(formData, "starts_at");

  if (!patientId || !validateUuid(patientId)) {
    redirect("/dashboard/appointments/new?error=ID%20inv%C3%A1lido");
  }
  if (!startsAt) {
    redirect("/dashboard/appointments/new?error=Informe%20a%20data%20e%20hora");
  }

  try {
    await createAppointment(
      {
        clinic_id: clinicId,
        patient_id: patientId,
        professional_id: readString(formData, "professional_id"),
        doctor_id: readString(formData, "doctor_id"),
        service_id: readString(formData, "service_id"),
        starts_at: startsAt,
        ends_at: readString(formData, "ends_at"),
        notes: readString(formData, "notes"),
      },
      user.id
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/appointments/new?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/appointments");
  redirect("/dashboard/appointments");
}

// ── Change Status (generic) ──────────────────────────────────────────────────

export async function changeAppointmentStatusAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const rl = deleteLimiter.check(user.id);
  if (!rl.allowed) {
    redirect("/dashboard/appointments?error=Limite%20de%20opera%C3%A7%C3%B5es%20atingido.");
  }

  const appointmentId = readString(formData, "appointment_id");
  const newStatus = readString(formData, "status") as AppointmentStatus | null;
  const reason = readString(formData, "reason");

  if (!appointmentId || !validateUuid(appointmentId) || !newStatus) {
    redirect("/dashboard/appointments?error=ID%20inv%C3%A1lido");
  }

  try {
    await changeAppointmentStatus(
      appointmentId,
      clinicId,
      newStatus,
      user.id,
      reason
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/appointments?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${appointmentId}`);
}

// ── Confirm (shortcut) ──────────────────────────────────────────────────────

export async function confirmAppointmentAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const appointmentId = readString(formData, "appointment_id");
  if (!appointmentId || !validateUuid(appointmentId)) {
    redirect("/dashboard/appointments?error=ID%20inv%C3%A1lido");
  }

  try {
    await confirmAppointment(appointmentId, clinicId, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/appointments?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath(`/dashboard/appointments/${appointmentId}`);
}
