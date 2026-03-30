"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import {
  createService,
  updateService,
  toggleServiceActive,
  deleteService,
} from "@/services/services-catalog.service";
import { actionLimiter } from "@/lib/rate-limit";
import { validateUuid } from "@/lib/validation/ids";

function readString(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireClinicId(clinicId: string | null): string {
  if (!clinicId) throw new Error("Clínica não identificada.");
  return clinicId;
}

export async function createServiceAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const rl = actionLimiter.check(user.id);
  if (!rl.allowed) {
    redirect("/dashboard/services?error=Limite%20de%20opera%C3%A7%C3%B5es%20atingido.");
  }

  const name = readString(formData, "name");
  if (!name) {
    redirect("/dashboard/services?error=Informe%20o%20nome%20do%20servico");
  }

  const durationStr = readString(formData, "duration_minutes");
  const duration = durationStr ? Number(durationStr) : 30;
  const priceStr = readString(formData, "price");
  const price = priceStr ? Number(priceStr) : null;

  try {
    await createService(clinicId, user.id, {
      name,
      description: readString(formData, "description"),
      duration_minutes: duration,
      price,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/services?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services?success=Servico%20adicionado");
}

export async function updateServiceAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const rl = actionLimiter.check(user.id);
  if (!rl.allowed) {
    redirect("/dashboard/services?error=Limite%20de%20opera%C3%A7%C3%B5es%20atingido.");
  }

  const serviceId = readString(formData, "service_id");
  if (!serviceId || !validateUuid(serviceId)) {
    redirect("/dashboard/services?error=ID%20inv%C3%A1lido");
  }

  const durationStr = readString(formData, "duration_minutes");
  const priceStr = readString(formData, "price");

  try {
    await updateService(serviceId, clinicId, user.id, {
      name: readString(formData, "name") ?? undefined,
      description: readString(formData, "description"),
      duration_minutes: durationStr ? Number(durationStr) : undefined,
      price: priceStr ? Number(priceStr) : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/services?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services?success=Servico%20atualizado");
}

export async function toggleServiceAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const rl = actionLimiter.check(user.id);
  if (!rl.allowed) {
    redirect("/dashboard/services?error=Limite%20de%20opera%C3%A7%C3%B5es%20atingido.");
  }

  const serviceId = readString(formData, "service_id");
  if (!serviceId || !validateUuid(serviceId)) {
    redirect("/dashboard/services?error=ID%20inv%C3%A1lido");
  }

  try {
    await toggleServiceActive(serviceId, clinicId, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/services?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services");
}

export async function deleteServiceAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireClinicId(ctx.clinicId);

  const rl = actionLimiter.check(user.id);
  if (!rl.allowed) {
    redirect("/dashboard/services?error=Limite%20de%20opera%C3%A7%C3%B5es%20atingido.");
  }

  const serviceId = readString(formData, "service_id");
  if (!serviceId || !validateUuid(serviceId)) {
    redirect("/dashboard/services?error=ID%20inv%C3%A1lido");
  }

  try {
    await deleteService(serviceId, clinicId, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/services?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services");
}
