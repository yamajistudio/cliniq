import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PlanResource = "professionals" | "patients" | "appointments_month";

type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type PlanRow = Database["public"]["Tables"]["plans"]["Row"];

type PlanLimitField =
  | "max_professionals"
  | "max_patients"
  | "max_appointments_month";

type LimitConfig = {
  table: "professionals" | "patients" | "appointments";
  countColumn: "id";
  dateFilter?: {
    column: "starts_at";
    start: string;
  };
  planField: PlanLimitField;
  friendlyName: string;
};

const RESOURCE_CONFIG: Record<PlanResource, LimitConfig> = {
  professionals: {
    table: "professionals",
    countColumn: "id",
    planField: "max_professionals",
    friendlyName: "profissionais",
  },
  patients: {
    table: "patients",
    countColumn: "id",
    planField: "max_patients",
    friendlyName: "pacientes",
  },
  appointments_month: {
    table: "appointments",
    countColumn: "id",
    dateFilter: {
      column: "starts_at",
      start: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString(),
    },
    planField: "max_appointments_month",
    friendlyName: "agendamentos neste mês",
  },
};

export type PlanLimitResult = {
  allowed: boolean;
  current: number;
  limit: number;
  resource: string;
};

type SubscriptionPlanSelection = Pick<
  PlanRow,
  "max_professionals" | "max_patients" | "max_appointments_month"
>;

type SubscriptionWithPlan = {
  status: Database["public"]["Tables"]["subscriptions"]["Row"]["status"];
  plan: SubscriptionPlanSelection | null;
};

async function countResourceUsage(
  clinicId: string,
  resource: PlanResource
): Promise<number> {
  const supabase = createClient();

  if (resource === "professionals") {
    const { count, error } = await supabase
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  if (resource === "patients") {
    const { count, error } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("status", "ACTIVE" as PatientRow["status"]);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  const monthStart = RESOURCE_CONFIG.appointments_month.dateFilter?.start;

  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .gte(
      "starts_at",
      monthStart ??
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString()
    );

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/**
 * Check if a clinic can create one more resource based on their plan limits.
 * Returns { allowed: true } if within limits, or { allowed: false, current, limit } if exceeded.
 * Returns { allowed: true } if no subscription exists (free pass during onboarding).
 */
export async function checkPlanLimit(
  clinicId: string,
  resource: PlanResource
): Promise<PlanLimitResult> {
  const safeClinicId = String(clinicId ?? "").trim();

  if (!safeClinicId) {
    return { allowed: true, current: 0, limit: 0, resource };
  }

  const config = RESOURCE_CONFIG[resource];
  const supabase = createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select(
      "status, plan:plans(max_professionals, max_patients, max_appointments_month)"
    )
    .eq("clinic_id", safeClinicId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const typedSubscription = subscription as SubscriptionWithPlan | null;

  // No subscription = no limits (onboarding phase)
  if (!typedSubscription || !typedSubscription.plan) {
    return { allowed: true, current: 0, limit: 0, resource };
  }

  const plan = typedSubscription.plan;
  const limit = plan[config.planField] ?? Infinity;

  // If limit is very high (e.g. Clínica+ with 5000 patients), skip counting for performance
  if (limit >= 9999) {
    return { allowed: true, current: 0, limit, resource };
  }

  const current = await countResourceUsage(safeClinicId, resource);

  return {
    allowed: current < limit,
    current,
    limit,
    resource: config.friendlyName,
  };
}

/**
 * Throws a user-friendly error if the plan limit is exceeded.
 */
export async function enforcePlanLimit(
  clinicId: string,
  resource: PlanResource
): Promise<void> {
  const result = await checkPlanLimit(clinicId, resource);

  if (!result.allowed) {
    throw new Error(
      `Limite do plano atingido: ${result.current}/${result.limit} ${result.resource}. Faça upgrade para continuar.`
    );
  }
}
