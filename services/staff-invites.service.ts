import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/services/audit.service";
import type { Database, ClinicRole } from "@/types/database";

type StaffInviteRow = Database["public"]["Tables"]["staff_invites"]["Row"];

export type { StaffInviteRow };

const VALID_ROLES: ClinicRole[] = ["CLINIC_ADMIN", "MANAGER", "DOCTOR", "RECEPTIONIST"];

function serviceError(base: string, raw: unknown, context: string) {
  const msg =
    raw instanceof Error
      ? raw.message
      : typeof (raw as any)?.message === "string"
      ? (raw as any).message
      : JSON.stringify(raw);
  return new Error(`${base} [context: ${context}]: ${msg}`);
}

export async function listStaffInvites(
  clinicId: string
): Promise<StaffInviteRow[]> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return [];

  const supabase = createClient();

  // Expire old pending invites
  await supabase
    .from("staff_invites")
    .update({ status: "EXPIRED" })
    .eq("clinic_id", safeClinicId)
    .eq("status", "PENDING")
    .lt("expires_at", new Date().toISOString());

  const { data, error } = await supabase
    .from("staff_invites")
    .select("*")
    .eq("clinic_id", safeClinicId)
    .order("created_at", { ascending: false });

  if (error) {
    throw serviceError("Falha ao listar convites", error, "staff_invites.select");
  }

  return (data ?? []) as StaffInviteRow[];
}

export async function createStaffInvite(
  clinicId: string,
  email: string,
  role: string,
  invitedBy: string
): Promise<StaffInviteRow> {
  const safeClinicId = String(clinicId ?? "").trim();
  const safeEmail = String(email ?? "").trim().toLowerCase();
  const safeRole = String(role ?? "").trim().toUpperCase() as ClinicRole;

  if (!safeClinicId) throw new Error("Clínica não identificada.");
  if (!safeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
    throw new Error("Informe um email válido.");
  }
  if (!VALID_ROLES.includes(safeRole)) {
    throw new Error("Selecione um perfil válido.");
  }

  // Check if already has pending invite
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("staff_invites")
    .select("id")
    .eq("clinic_id", safeClinicId)
    .eq("email", safeEmail)
    .eq("status", "PENDING")
    .maybeSingle();

  if (existing) {
    throw new Error("Já existe um convite pendente para este email.");
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("clinic_memberships")
    .select("id, profiles(email)")
    .eq("clinic_id", safeClinicId)
    .eq("status", "ACTIVE");

  const memberEmails = (existingMember ?? [])
    .map((m: any) => m.profiles?.email?.toLowerCase())
    .filter(Boolean);

  if (memberEmails.includes(safeEmail)) {
    throw new Error("Este email já é membro da clínica.");
  }

  // Create invite (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("staff_invites")
    .insert({
      clinic_id: safeClinicId,
      email: safeEmail,
      role: safeRole,
      expires_at: expiresAt.toISOString(),
      invited_by: invitedBy,
    })
    .select("*")
    .single();

  if (error) {
    throw serviceError("Falha ao criar convite", error, "staff_invites.insert");
  }

  await logAction(
    "create_staff_invite",
    "staff_invite",
    (data as StaffInviteRow).id,
    { email: safeEmail, role: safeRole },
    invitedBy,
    { softFail: true }
  );

  return data as StaffInviteRow;
}

export async function revokeStaffInvite(
  inviteId: string,
  clinicId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("staff_invites")
    .update({ status: "REVOKED" })
    .eq("id", inviteId)
    .eq("clinic_id", clinicId)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();

  if (error) {
    throw serviceError("Falha ao revogar convite", error, "staff_invites.revoke");
  }

  if (!data) {
    throw new Error("Convite pendente não encontrado.");
  }

  await logAction("revoke_staff_invite", "staff_invite", inviteId, {}, userId, { softFail: true });
}
