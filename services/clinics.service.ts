import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

export type ClinicMemberRow = {
  user_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
};

export async function getClinicById(clinicId: string): Promise<ClinicRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", clinicId)
    .single();

  if (error) throw new Error(`Falha ao buscar clínica: ${error.message}`);
  return data as ClinicRow;
}

export async function updateClinic(
  clinicId: string,
  patch: Partial<ClinicRow>
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("clinics")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clinicId);

  if (error) throw new Error(`Falha ao atualizar clínica: ${error.message}`);
}

export async function listClinicMembers(
  clinicId: string
): Promise<ClinicMemberRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_memberships")
    .select("user_id, role, profiles(full_name, email)")
    .eq("clinic_id", clinicId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao listar equipe: ${error.message}`);

  type MembershipWithProfile = {
    user_id: string;
    role: string;
    profiles: { full_name: string | null; email: string | null } | null;
  };

  return (data ?? []).map((row) => {
    const r = row as unknown as MembershipWithProfile;
    return {
      user_id: r.user_id,
      role: r.role,
      full_name: r.profiles?.full_name ?? null,
      email: r.profiles?.email ?? null,
    };
  });
}
