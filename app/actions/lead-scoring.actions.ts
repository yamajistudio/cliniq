"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { recalculateLeadScore } from "@/services/lead-scoring.service";
import { validateUuid } from "@/lib/validation/ids";

export async function recalculateScoreAction(formData: FormData) {
  const user = await requireUser();
  const ctx  = await getUserContext(user.id);

  if (!ctx.clinicId) redirect("/dashboard?error=Clinica%20nao%20encontrada");

  const leadId = String(formData.get("lead_id") ?? "").trim();

  if (!validateUuid(leadId)) {
    redirect("/dashboard/leads?error=Lead%20invalido");
  }

  try {
    await recalculateLeadScore(ctx.clinicId, leadId);
  } catch (err) {
    const msg = encodeURIComponent(
      err instanceof Error ? err.message : "Erro ao recalcular score"
    );
    redirect(`/dashboard/leads/${leadId}?error=${msg}`);
  }

  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/leads");
  redirect(`/dashboard/leads/${leadId}?success=Score%20recalculado`);
}
