import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type HistoryRow =
  Database["public"]["Tables"]["appointment_status_history"]["Row"];

export type { HistoryRow as AppointmentStatusHistoryRow };

export type HistoryWithActor = HistoryRow & {
  actor_name: string | null;
  actor_email: string | null;
};

function serviceError(base: string, raw: unknown, context: string) {
  const anyRaw = raw as { message?: string } | null;
  const msg =
    raw instanceof Error
      ? raw.message
      : typeof anyRaw?.message === "string"
      ? anyRaw.message
      : JSON.stringify(raw);
  return new Error(`${base} [context: ${context}]: ${msg}`);
}

export async function logStatusTransition(
  appointmentId: string,
  clinicId: string,
  fromStatus: string | null,
  toStatus: string,
  changedBy: string,
  reason?: string | null
): Promise<HistoryRow> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointment_status_history")
    .insert({
      appointment_id: appointmentId,
      clinic_id: clinicId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      reason: reason?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    throw serviceError(
      "Falha ao registrar transição de status",
      error,
      "appointment_status_history.insert"
    );
  }

  return data as HistoryRow;
}

export async function listStatusHistory(
  appointmentId: string,
  clinicId: string
): Promise<HistoryWithActor[]> {
  const safeId = String(appointmentId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeId || !safeClinicId) return [];

  const supabase = createClient();

  const { data, error } = await supabase
    .from("appointment_status_history")
    .select("*")
    .eq("appointment_id", safeId)
    .eq("clinic_id", safeClinicId)
    .order("created_at", { ascending: true });

  if (error) {
    throw serviceError(
      "Falha ao listar histórico de status",
      error,
      "appointment_status_history.select"
    );
  }

  const rows = (data ?? []) as HistoryRow[];
  if (rows.length === 0) return [];

  // Buscar nomes dos atores
  const userIds = [...new Set(rows.map((r) => r.changed_by).filter(Boolean))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: any) => [p.id, p])
  );

  return rows.map((row) => {
    const profile = profileMap.get(row.changed_by);
    return {
      ...row,
      actor_name: profile?.full_name ?? null,
      actor_email: profile?.email ?? null,
    };
  });
}
