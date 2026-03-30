import { createClient } from "@/lib/supabase/server";

export type PlanRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  max_professionals: number;
  max_patients: number;
  max_appointments_month: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
};

export type SubscriptionRow = {
  id: string;
  clinic_id: string;
  plan_id: string;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  started_at: string;
  expires_at: string | null;
  trial_end: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SubscriptionWithPlan = SubscriptionRow & {
  plan: PlanRow;
};

export type SubscriptionStatus = {
  hasSubscription: boolean;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  subscription: SubscriptionWithPlan | null;
  plan: PlanRow | null;
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export async function listPlans(): Promise<PlanRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as PlanRow[];
}

export async function getSubscriptionStatus(clinicId: string): Promise<SubscriptionStatus> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) {
    return { hasSubscription: false, isActive: false, isTrial: false, isExpired: false, daysRemaining: null, subscription: null, plan: null };
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*, plan:plans(*)")
    .eq("clinic_id", safeClinicId)
    .maybeSingle();

  if (!data) {
    return { hasSubscription: false, isActive: false, isTrial: false, isExpired: false, daysRemaining: null, subscription: null, plan: null };
  }

  const sub = data as SubscriptionWithPlan;
  const now = new Date();

  const isTrial = sub.status === "TRIAL";
  const trialExpired = isTrial && sub.trial_end && new Date(sub.trial_end) < now;
  const subExpired = sub.expires_at && new Date(sub.expires_at) < now;
  const isExpired = Boolean(trialExpired || subExpired) || sub.status === "EXPIRED" || sub.status === "CANCELLED";
  const isActive = !isExpired && ["TRIAL", "ACTIVE"].includes(sub.status);

  const endDate = isTrial ? sub.trial_end : sub.expires_at;
  const daysRemaining = daysUntil(endDate);

  return {
    hasSubscription: true,
    isActive,
    isTrial,
    isExpired,
    daysRemaining,
    subscription: sub,
    plan: sub.plan,
  };
}

export async function createTrialSubscription(clinicId: string): Promise<SubscriptionRow> {
  const supabase = createClient();

  // Get starter plan
  const { data: starterPlan } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", "starter")
    .single();

  if (!starterPlan) throw new Error("Plano Starter não encontrado.");

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert({
      clinic_id: clinicId,
      plan_id: starterPlan.id,
      status: "TRIAL",
      trial_end: trialEnd.toISOString(),
      started_at: new Date().toISOString(),
    }, { onConflict: "clinic_id" })
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao criar trial: ${error.message}`);
  return data as SubscriptionRow;
}
