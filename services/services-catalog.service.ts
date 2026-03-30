import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/services/audit.service";

// ── Types ────────────────────────────────────────────────────────────────────

export type ServiceCatalogRow = {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateServiceInput = {
  name: string;
  description?: string | null;
  duration_minutes: number;
  price?: number | null;
};

export type UpdateServiceInput = Partial<CreateServiceInput>;

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── List / Get ───────────────────────────────────────────────────────────────

export async function listServices(clinicId: string): Promise<ServiceCatalogRow[]> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("services_catalog")
    .select("*")
    .eq("clinic_id", safeClinicId)
    .order("name", { ascending: true });

  if (error) {
    throw serviceError("Falha ao listar serviços", error, "services_catalog.select");
  }

  return (data ?? []) as ServiceCatalogRow[];
}

export async function getServiceById(
  serviceId: string,
  clinicId: string
): Promise<ServiceCatalogRow | null> {
  const safeId = String(serviceId ?? "").trim();
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeId || !safeClinicId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("services_catalog")
    .select("*")
    .eq("id", safeId)
    .eq("clinic_id", safeClinicId)
    .maybeSingle();

  if (error) {
    throw serviceError("Falha ao buscar serviço", error, "services_catalog.selectById");
  }

  return (data as ServiceCatalogRow | null) ?? null;
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createService(
  clinicId: string,
  actorId: string,
  input: CreateServiceInput
): Promise<ServiceCatalogRow> {
  const name = String(input.name ?? "").trim();
  if (!name) throw new Error("Informe o nome do serviço.");
  if (!Number.isFinite(input.duration_minutes) || input.duration_minutes <= 0) {
    throw new Error("Duração deve ser maior que zero.");
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("services_catalog")
    .insert({
      clinic_id: clinicId,
      name,
      description: input.description?.trim() || null,
      duration_minutes: input.duration_minutes,
      price: input.price ?? null,
      created_by: actorId,
    })
    .select("*")
    .single();

  if (error) {
    throw serviceError("Falha ao criar serviço", error, "services_catalog.insert");
  }

  await logAction(
    "create_service",
    "service",
    (data as ServiceCatalogRow).id,
    { name },
    actorId,
    { softFail: true }
  );

  return data as ServiceCatalogRow;
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateService(
  serviceId: string,
  clinicId: string,
  actorId: string,
  input: UpdateServiceInput
): Promise<ServiceCatalogRow> {
  const existing = await getServiceById(serviceId, clinicId);
  if (!existing) throw new Error("Serviço não encontrado nesta clínica.");

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name) throw new Error("Nome do serviço não pode ser vazio.");
    updateData.name = name;
  }
  if (input.description !== undefined) {
    updateData.description = input.description?.trim() || null;
  }
  if (input.duration_minutes !== undefined) {
    if (!Number.isFinite(input.duration_minutes) || input.duration_minutes <= 0) {
      throw new Error("Duração deve ser maior que zero.");
    }
    updateData.duration_minutes = input.duration_minutes;
  }
  if (input.price !== undefined) {
    updateData.price = input.price ?? null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("services_catalog")
    .update(updateData)
    .eq("id", serviceId)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) {
    throw serviceError("Falha ao atualizar serviço", error, "services_catalog.update");
  }

  await logAction(
    "update_service",
    "service",
    serviceId,
    { fields: Object.keys(updateData).filter((k) => k !== "updated_at") },
    actorId,
    { softFail: true }
  );

  return data as ServiceCatalogRow;
}

// ── Toggle Active ─────────────────────────────────────────────────────────────

export async function toggleServiceActive(
  serviceId: string,
  clinicId: string,
  actorId: string
): Promise<ServiceCatalogRow> {
  const existing = await getServiceById(serviceId, clinicId);
  if (!existing) throw new Error("Serviço não encontrado nesta clínica.");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("services_catalog")
    .update({
      is_active: !existing.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) {
    throw serviceError("Falha ao alterar status do serviço", error, "services_catalog.toggle");
  }

  await logAction(
    "toggle_service",
    "service",
    serviceId,
    { is_active: !existing.is_active },
    actorId,
    { softFail: true }
  );

  return data as ServiceCatalogRow;
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteService(
  serviceId: string,
  clinicId: string,
  actorId: string
): Promise<void> {
  const existing = await getServiceById(serviceId, clinicId);
  if (!existing) throw new Error("Serviço não encontrado nesta clínica.");

  // Verifica se há agendamentos vinculados ao serviço
  const supabase = createClient();
  const { data: linked } = await supabase
    .from("appointments")
    .select("id")
    .eq("service_id", serviceId)
    .eq("clinic_id", clinicId)
    .limit(1);

  if (linked && linked.length > 0) {
    throw new Error(
      "Este serviço possui agendamentos vinculados. Desative-o em vez de excluir."
    );
  }

  const { error } = await supabase
    .from("services_catalog")
    .delete()
    .eq("id", serviceId)
    .eq("clinic_id", clinicId);

  if (error) {
    throw serviceError("Falha ao excluir serviço", error, "services_catalog.delete");
  }

  await logAction(
    "delete_service",
    "service",
    serviceId,
    { name: existing.name },
    actorId,
    { softFail: true }
  );
}
