"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import {
  createLead,
  updateLead,
  convertLeadToPatient,
} from "@/services/leads.service";
import type { LeadSource, LeadStatus } from "@/types/database";
import { validateUuid } from "@/lib/validation/ids";

export async function createLeadAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  if (!ctx.clinicId) {
    redirect("/dashboard?error=Clinica%20nao%20encontrada");
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const source = (String(formData.get("source") ?? "OUTRO").trim()) as LeadSource;

  if (!fullName) {
    redirect("/dashboard/leads?error=Informe%20o%20nome%20do%20lead");
  }

  try {
    await createLead(
      {
        clinic_id: ctx.clinicId,
        full_name: fullName,
        phone: formData.get("phone") as string | null,
        email: formData.get("email") as string | null,
        source,
        notes: formData.get("notes") as string | null,
      },
      user.id
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/leads?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/leads");
  redirect("/dashboard/leads");
}

export async function updateLeadStatusAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const leadId = String(formData.get("lead_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as LeadStatus;

  if (!ctx.clinicId || !leadId || !validateUuid(leadId) || !status) {
    redirect("/dashboard/leads?error=ID%20inv%C3%A1lido");
  }

  try {
    await updateLead(leadId, ctx.clinicId, { status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/leads?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/leads");
}

export async function convertLeadAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const leadId = String(formData.get("lead_id") ?? "").trim();

  if (!ctx.clinicId || !leadId || !validateUuid(leadId)) {
    redirect("/dashboard/leads?error=ID%20inv%C3%A1lido");
  }

  try {
    const { patientId } = await convertLeadToPatient(
      leadId,
      ctx.clinicId,
      user.id
    );
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/patients");
    redirect(`/dashboard/patients/${patientId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/leads?error=${encodeURIComponent(msg)}`);
  }
}
