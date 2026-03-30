"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { getAppointmentById } from "@/services/appointments.service";
import { upsertMedicalRecord } from "@/services/medical-records.service";

function readString(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function saveMedicalRecordAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  if (!ctx.clinicId) redirect("/dashboard");

  const appointmentId = readString(formData, "appointment_id");
  if (!appointmentId) redirect("/dashboard/appointments?error=Consulta%20nao%20identificada");

  const appointment = await getAppointmentById(appointmentId, ctx.clinicId);
  if (!appointment) redirect("/dashboard/appointments?error=Consulta%20nao%20encontrada");

  try {
    await upsertMedicalRecord({
      clinic_id: ctx.clinicId,
      appointment_id: appointmentId,
      patient_id: appointment.patient_id,
      professional_id: appointment.professional_id,
      notes: readString(formData, "notes"),
      diagnosis: readString(formData, "diagnosis"),
      prescription: readString(formData, "prescription"),
    }, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro";
    redirect(`/dashboard/appointments/${appointmentId}/record?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(`/dashboard/appointments/${appointmentId}`);
  redirect(`/dashboard/appointments/${appointmentId}/record?success=Prontuario%20salvo`);
}
