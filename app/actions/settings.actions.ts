"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { isClinicAdmin } from "@/lib/permissions";
import { updateClinic } from "@/services/clinics.service";
import { upsertClinicSettings } from "@/services/clinic-settings.service";
import { upsertNotificationSettings } from "@/services/notification-settings.service";
import { sensitiveLimiter, permissionLimiter } from "@/lib/rate-limit";
import { createStaffInvite, revokeStaffInvite } from "@/services/staff-invites.service";
import { validateUuid } from "@/lib/validation/ids";

function requireAdmin(ctx: any): string {
  if (!ctx.clinicId) throw new Error("Clínica não identificada.");
  if (!isClinicAdmin(ctx)) throw new Error("Apenas administradores podem alterar configurações.");
  return ctx.clinicId;
}

function readString(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function readNumber(formData: FormData, key: string): number | undefined {
  const raw = readString(formData, key);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

// ── Update Clinic Data ───────────────────────────────────────────────────────

export async function updateClinicAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireAdmin(ctx);

  try {
    await updateClinic(clinicId, {
      name: readString(formData, "name") ?? undefined,
      legal_name: readString(formData, "legal_name"),
      tax_id: readString(formData, "tax_id"),
      phone: readString(formData, "phone"),
      email: readString(formData, "email"),
      address: readString(formData, "address"),
      city: readString(formData, "city"),
      state: readString(formData, "state"),
    } as any);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/settings?tab=clinic&error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?tab=clinic&success=Dados%20atualizados");
}

// ── Update Schedule Settings ─────────────────────────────────────────────────

export async function updateClinicSettingsAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireAdmin(ctx);

  try {
    const daysOpenRaw = formData.getAll("days_open");
    const daysOpen = daysOpenRaw
      .map((d) => Number(d))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);

    await upsertClinicSettings(clinicId, {
      opening_time: readString(formData, "opening_time") ?? undefined,
      closing_time: readString(formData, "closing_time") ?? undefined,
      slot_duration_minutes: readNumber(formData, "slot_duration_minutes"),
      days_open: daysOpen.length > 0 ? daysOpen : undefined,
      lunch_start: readString(formData, "lunch_start"),
      lunch_end: readString(formData, "lunch_end"),
      appointment_buffer_minutes: readNumber(formData, "appointment_buffer_minutes"),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/settings?tab=schedule&error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/appointments");
  redirect("/dashboard/settings?tab=schedule&success=Horarios%20atualizados");
}

// ── Update Notification Settings ─────────────────────────────────────────────

export async function updateNotificationSettingsAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireAdmin(ctx);

  try {
    await upsertNotificationSettings(clinicId, {
      confirm_enabled: readBool(formData, "confirm_enabled"),
      confirm_hours_before: readNumber(formData, "confirm_hours_before"),
      confirm_channel: readString(formData, "confirm_channel") ?? undefined,
      reminder_enabled: readBool(formData, "reminder_enabled"),
      reminder_hours_before: readNumber(formData, "reminder_hours_before"),
      reminder_channel: readString(formData, "reminder_channel") ?? undefined,
      followup_enabled: readBool(formData, "followup_enabled"),
      followup_days_after: readNumber(formData, "followup_days_after"),
      followup_channel: readString(formData, "followup_channel") ?? undefined,
      birthday_enabled: readBool(formData, "birthday_enabled"),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/settings?tab=notifications&error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?tab=notifications&success=Notificacoes%20atualizadas");
}

// ── Invite Staff Member ──────────────────────────────────────────────────────

export async function inviteStaffAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireAdmin(ctx);

  // Rate limit: sensitive action (3/min per user)
  const rl = sensitiveLimiter.check(`invite:${user.id}`);
  if (!rl.allowed) {
    redirect("/dashboard/settings?tab=team&error=Muitas%20tentativas.%20Aguarde%201%20minuto.");
  }

  const email = readString(formData, "email");
  const role = readString(formData, "role");

  if (!email) {
    redirect("/dashboard/settings?tab=team&error=Informe%20o%20email");
  }
  if (!role) {
    redirect("/dashboard/settings?tab=team&error=Selecione%20o%20perfil");
  }

  try {
    await createStaffInvite(clinicId, email, role, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/settings?tab=team&error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?tab=team&success=Convite%20enviado");
}

// ── Update WhatsApp Settings ─────────────────────────────────────────────────

export async function updateWhatsAppSettingsAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireAdmin(ctx);

  const phoneNumberId = readString(formData, "whatsapp_phone_number_id");
  const enabled = readBool(formData, "whatsapp_enabled");

  try {
    const supabase = (await import("@/lib/supabase/server")).createClient();
    await supabase
      .from("clinic_settings")
      .upsert(
        {
          clinic_id: clinicId,
          whatsapp_phone_number_id: phoneNumberId,
          whatsapp_enabled: enabled,
        } as any,
        { onConflict: "clinic_id" }
      );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    throw new Error(msg);
  }

  revalidatePath("/dashboard/settings");
}

// ── Revoke Invite ────────────────────────────────────────────────────────────

export async function revokeInviteAction(formData: FormData) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const clinicId = requireAdmin(ctx);

  const rl = permissionLimiter.check(user.id);
  if (!rl.allowed) {
    redirect("/dashboard/settings?tab=team&error=Limite%20de%20opera%C3%A7%C3%B5es%20atingido.");
  }

  const inviteId = readString(formData, "invite_id");
  if (!inviteId || !validateUuid(inviteId)) {
    redirect("/dashboard/settings?tab=team&error=ID%20inv%C3%A1lido");
  }

  try {
    await revokeStaffInvite(inviteId, clinicId, user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    redirect(`/dashboard/settings?tab=team&error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?tab=team");
}
