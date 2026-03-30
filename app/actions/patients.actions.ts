"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import {
  createPatient,
  updatePatient,
  deletePatient,
  togglePatientStatus,
} from "@/services/patients.service";
import { validateUuid } from "@/lib/validation/ids";
import { deleteLimiter } from "@/lib/rate-limit";

function requireClinicId(clinicId: string | null): string {
  if (!clinicId) {
    throw new Error("Você não está vinculado a nenhuma clínica.");
  }
  return clinicId;
}

function readString(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createPatientAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const fullName = readString(formData, "full_name");
  if (!fullName) {
    redirect("/dashboard/patients/new?error=Informe%20o%20nome%20do%20paciente");
  }

  try {
    const patient = await createPatient(
      {
        clinic_id: clinicId,
        full_name: fullName,
        cpf: readString(formData, "cpf"),
        email: readString(formData, "email"),
        phone: readString(formData, "phone"),
        birth_date: readString(formData, "birth_date"),
        gender: readString(formData, "gender"),
        address: readString(formData, "address"),
        notes: readString(formData, "notes"),
        source: readString(formData, "source"),
      },
      user.id
    );

    revalidatePath("/dashboard/patients");
    redirect(`/dashboard/patients/${patient.id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/patients/new?error=${encodeURIComponent(msg)}`);
  }
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updatePatientAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);
  const patientId = readString(formData, "patient_id");

  if (!patientId || !validateUuid(patientId)) {
    redirect("/dashboard/patients?error=ID%20inv%C3%A1lido");
  }

  try {
    await updatePatient(
      patientId,
      clinicId,
      {
        full_name: readString(formData, "full_name") ?? undefined,
        cpf: readString(formData, "cpf"),
        email: readString(formData, "email"),
        phone: readString(formData, "phone"),
        birth_date: readString(formData, "birth_date"),
        gender: readString(formData, "gender"),
        address: readString(formData, "address"),
        notes: readString(formData, "notes"),
        source: readString(formData, "source"),
      },
      user.id
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/patients/${patientId}/edit?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  redirect(`/dashboard/patients/${patientId}`);
}

// ── Toggle Active/Inactive ───────────────────────────────────────────────────

export async function togglePatientStatusAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);
  const patientId = readString(formData, "patient_id");

  if (!patientId || !validateUuid(patientId)) {
    redirect("/dashboard/patients?error=ID%20inv%C3%A1lido");
  }

  try {
    await togglePatientStatus(patientId, clinicId, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/patients/${patientId}?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  revalidatePath("/dashboard/patients");
  redirect(`/dashboard/patients/${patientId}`);
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deletePatientAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const rl = deleteLimiter.check(user.id);
  if (!rl.allowed) {
    redirect("/dashboard/patients?error=Muitas%20opera%C3%A7%C3%B5es%20em%20pouco%20tempo.%20Aguarde%201%20minuto.");
  }

  const patientId = readString(formData, "patient_id");

  if (!patientId || !validateUuid(patientId)) {
    redirect("/dashboard/patients?error=ID%20inv%C3%A1lido");
  }

  try {
    await deletePatient(patientId, clinicId, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/patients/${patientId}?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/patients");
  redirect("/dashboard/patients");
}
