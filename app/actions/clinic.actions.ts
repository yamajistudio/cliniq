"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import {
  getClinicMemberships,
  setActiveClinic,
} from "@/services/clinic-memberships.service";

export async function switchClinicAction(formData: FormData) {
  const user = await requireUser();
  const clinicId = String(formData.get("clinic_id") ?? "").trim();

  if (!clinicId) {
    redirect("/dashboard?error=Clinica%20nao%20identificada");
  }

  // Validate user has membership in target clinic
  const memberships = await getClinicMemberships(user.id);
  const valid = memberships.some((m) => m.clinic_id === clinicId);

  if (!valid) {
    redirect("/dashboard?error=Sem%20acesso%20a%20esta%20clinica");
  }

  setActiveClinic(clinicId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
