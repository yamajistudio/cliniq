"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import {
  createProfessional,
  updateProfessional,
  toggleProfessionalActive,
  saveBulkSchedules,
} from "@/services/professionals.service";
import { validateUuid } from "@/lib/validation/ids";

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

export async function createProfessionalAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const fullName = readString(formData, "full_name");
  const specialty = readString(formData, "specialty");

  if (!fullName) {
    redirect("/dashboard/professionals/new?error=Informe%20o%20nome%20do%20profissional");
  }
  if (!specialty) {
    redirect("/dashboard/professionals/new?error=Informe%20a%20especialidade");
  }

  try {
    const professional = await createProfessional(
      {
        clinic_id: clinicId,
        full_name: fullName,
        specialty,
        license_number: readString(formData, "license_number"),
        phone: readString(formData, "phone"),
        email: readString(formData, "email"),
        color: readString(formData, "color") ?? "#3B82F6",
      },
      user.id
    );

    revalidatePath("/dashboard/professionals");
    redirect(`/dashboard/professionals/${professional.id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/professionals/new?error=${encodeURIComponent(msg)}`);
  }
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateProfessionalAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);
  const professionalId = readString(formData, "professional_id");

  if (!professionalId || !validateUuid(professionalId)) {
    redirect("/dashboard/professionals?error=ID%20inv%C3%A1lido");
  }

  try {
    await updateProfessional(
      professionalId,
      clinicId,
      {
        full_name: readString(formData, "full_name") ?? undefined,
        specialty: readString(formData, "specialty") ?? undefined,
        license_number: readString(formData, "license_number"),
        phone: readString(formData, "phone"),
        email: readString(formData, "email"),
        color: readString(formData, "color") ?? undefined,
      },
      user.id
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/professionals/${professionalId}/edit?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(`/dashboard/professionals/${professionalId}`);
  redirect(`/dashboard/professionals/${professionalId}`);
}

// ── Toggle Active ────────────────────────────────────────────────────────────

export async function toggleProfessionalActiveAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);
  const professionalId = readString(formData, "professional_id");

  if (!professionalId || !validateUuid(professionalId)) {
    redirect("/dashboard/professionals?error=ID%20inv%C3%A1lido");
  }

  try {
    await toggleProfessionalActive(professionalId, clinicId, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/professionals/${professionalId}?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(`/dashboard/professionals/${professionalId}`);
  revalidatePath("/dashboard/professionals");
  redirect(`/dashboard/professionals/${professionalId}`);
}

// ── Save Schedule ────────────────────────────────────────────────────────────

export async function saveScheduleAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);
  const professionalId = readString(formData, "professional_id");

  if (!professionalId || !validateUuid(professionalId)) {
    redirect("/dashboard/professionals?error=ID%20inv%C3%A1lido");
  }

  try {
    const schedulesJson = readString(formData, "schedules_json");
    if (!schedulesJson) throw new Error("Dados de horários ausentes.");

    const schedules = JSON.parse(schedulesJson) as Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      slot_duration_minutes: number;
      is_active: boolean;
    }>;

    await saveBulkSchedules(professionalId, clinicId, schedules);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/professionals/${professionalId}?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(`/dashboard/professionals/${professionalId}`);
  redirect(`/dashboard/professionals/${professionalId}`);
}
