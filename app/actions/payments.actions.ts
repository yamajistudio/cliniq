"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { createPayment, markAsPaid } from "@/services/payments.service";
import { validateUuid } from "@/lib/validation/ids";
import { paymentLimiter } from "@/lib/rate-limit";

function readString(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function createPaymentAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  if (!ctx.clinicId) redirect("/dashboard?error=Clinica%20nao%20encontrada");

  const rl = paymentLimiter.check(user.id);
  if (!rl.allowed) {
    redirect("/dashboard/financeiro?error=Limite%20de%20opera%C3%A7%C3%B5es%20atingido.");
  }

  const patientId = readString(formData, "patient_id");
  const amountStr = readString(formData, "amount");
  if (!patientId || !validateUuid(patientId)) redirect("/dashboard/financeiro?error=ID%20inv%C3%A1lido");
  if (!amountStr) redirect("/dashboard/financeiro?error=Dados%20incompletos");

  try {
    await createPayment({
      clinic_id: ctx.clinicId,
      patient_id: patientId,
      appointment_id: readString(formData, "appointment_id"),
      amount: Number(amountStr),
      payment_method: readString(formData, "payment_method"),
      notes: readString(formData, "notes"),
    }, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro";
    redirect(`/dashboard/financeiro?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/financeiro");
  redirect("/dashboard/financeiro?success=Pagamento%20registrado");
}

export async function markAsPaidAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  if (!ctx.clinicId) redirect("/dashboard?error=Clinica%20nao%20encontrada");

  const rl = paymentLimiter.check(user.id);
  if (!rl.allowed) {
    redirect("/dashboard/financeiro?error=Limite%20de%20opera%C3%A7%C3%B5es%20atingido.");
  }

  const paymentId = readString(formData, "payment_id");
  const method = readString(formData, "payment_method") ?? "DINHEIRO";
  if (!paymentId || !validateUuid(paymentId)) redirect("/dashboard/financeiro?error=ID%20inv%C3%A1lido");

  try {
    await markAsPaid(paymentId, ctx.clinicId, method, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro";
    redirect(`/dashboard/financeiro?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard");
}
