import { createClient } from "@/lib/supabase/server";

export type OnboardingStep = {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  href: string;
  actionLabel: string;
};

export type OnboardingStatus = {
  steps: OnboardingStep[];
  completedCount: number;
  totalSteps: number;
  isComplete: boolean;
  percentComplete: number;
  currentStep: OnboardingStep | null;
};

const STEPS_CONFIG = [
  { key: "create_clinic", label: "Dados da clínica", description: "Configure nome, telefone e endereço", href: "/dashboard/settings?tab=clinic", actionLabel: "Configurar clínica" },
  { key: "add_professional", label: "Primeiro profissional", description: "Cadastre um médico ou profissional", href: "/dashboard/professionals/new", actionLabel: "Cadastrar profissional" },
  { key: "add_service", label: "Primeiro serviço", description: "Cadastre um serviço ou procedimento", href: "/dashboard/services", actionLabel: "Cadastrar serviço" },
  { key: "add_patient", label: "Primeiro paciente", description: "Cadastre seu primeiro paciente", href: "/dashboard/patients/new", actionLabel: "Cadastrar paciente" },
  { key: "create_appointment", label: "Primeiro agendamento", description: "Agende a primeira consulta", href: "/dashboard/appointments/new", actionLabel: "Criar agendamento" },
];

export async function getOnboardingStatus(clinicId: string): Promise<OnboardingStatus> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return emptyStatus();

  const supabase = createClient();

  // Fetch persisted progress
  const { data: progress } = await supabase
    .from("onboarding_progress")
    .select("step, completed, completed_at")
    .eq("clinic_id", safeClinicId);

  const progressMap = new Map(
    (progress ?? []).map((p: any) => [p.step, { completed: p.completed, completedAt: p.completed_at }])
  );

  // Auto-detect completion for steps not yet marked
  const [clinicRes, profsRes, servicesRes, patientsRes, apptsRes] = await Promise.all([
    supabase.from("clinics").select("name, phone, email").eq("id", safeClinicId).maybeSingle(),
    supabase.from("professionals").select("id").eq("clinic_id", safeClinicId).eq("is_active", true).limit(1),
    supabase.from("services_catalog").select("id").eq("clinic_id", safeClinicId).eq("is_active", true).limit(1),
    supabase.from("patients").select("id").eq("clinic_id", safeClinicId).limit(1),
    supabase.from("appointments").select("id").eq("clinic_id", safeClinicId).limit(1),
  ]);

  const autoDetect: Record<string, boolean> = {
    create_clinic: Boolean(clinicRes.data?.name && (clinicRes.data?.phone || clinicRes.data?.email)),
    add_professional: (profsRes.data ?? []).length > 0,
    add_service: (servicesRes.data ?? []).length > 0,
    add_patient: (patientsRes.data ?? []).length > 0,
    create_appointment: (apptsRes.data ?? []).length > 0,
  };

  // Merge persisted + auto-detected, and persist any newly detected
  const stepsToUpsert: Array<{ clinic_id: string; step: string; completed: boolean; completed_at: string }> = [];

  const steps: OnboardingStep[] = STEPS_CONFIG.map((config) => {
    const persisted = progressMap.get(config.key);
    const autoCompleted = autoDetect[config.key] ?? false;
    const completed = persisted?.completed || autoCompleted;

    // If auto-detected but not persisted, queue for upsert
    if (autoCompleted && !persisted?.completed) {
      stepsToUpsert.push({
        clinic_id: safeClinicId,
        step: config.key,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    return {
      ...config,
      completed,
      completedAt: persisted?.completedAt ?? (autoCompleted ? new Date().toISOString() : null),
    };
  });

  // Persist auto-detected progress (fire and forget)
  if (stepsToUpsert.length > 0) {
    supabase
      .from("onboarding_progress")
      .upsert(stepsToUpsert, { onConflict: "clinic_id,step" })
      .then(() => {});
  }

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const currentStep = steps.find((s) => !s.completed) ?? null;

  return {
    steps,
    completedCount,
    totalSteps,
    isComplete: completedCount === totalSteps,
    percentComplete: Math.round((completedCount / totalSteps) * 100),
    currentStep,
  };
}

export async function markStepCompleted(clinicId: string, step: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("onboarding_progress").upsert(
    { clinic_id: clinicId, step, completed: true, completed_at: new Date().toISOString() },
    { onConflict: "clinic_id,step" }
  );
}

function emptyStatus(): OnboardingStatus {
  return { steps: [], completedCount: 0, totalSteps: 0, isComplete: false, percentComplete: 0, currentStep: null };
}
