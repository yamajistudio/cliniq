import { createClient } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────────────────────

export type DashboardMetrics = {
  // Appointments
  appointmentsToday: number;
  appointmentsConfirmedToday: number;
  appointmentsPendingConfirmation: number;
  completedThisMonth: number;

  // Rates
  noShowRate: number;
  confirmationRate: number;

  // Patients
  patientsTotal: number;
  patientsThisMonth: number;

  // Leads
  leadsNew: number;
  leadsConversionRate: number;

  // Computed
  avgAppointmentsPerDay: number;
};

export type TodayAppointment = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  notes: string | null;
  patient_name: string;
  professional_name: string | null;
  professional_color: string | null;
};

export type PendingAction = {
  type: "no_show_yesterday" | "unconfirmed_today" | "follow_up_pending";
  id: string;
  label: string;
  sublabel: string;
  href: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function startOfLast30Days(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// ── Materialized View type ───────────────────────────────────────────────────

type MvDashboardMetrics = {
  clinic_id: string;
  appointments_today: number;
  confirmed_today: number;
  active_patients: number;
  leads_last_30d: number;
  revenue_month: number;
};

// ── Main Metrics ─────────────────────────────────────────────────────────────

export async function getDashboardMetrics(
  clinicId: string
): Promise<DashboardMetrics> {
  const safeClinicId = String(clinicId ?? "").trim();

  if (!safeClinicId) {
    return {
      appointmentsToday: 0,
      appointmentsConfirmedToday: 0,
      appointmentsPendingConfirmation: 0,
      completedThisMonth: 0,
      noShowRate: 0,
      confirmationRate: 0,
      patientsTotal: 0,
      patientsThisMonth: 0,
      leadsNew: 0,
      leadsConversionRate: 0,
      avgAppointmentsPerDay: 0,
    };
  }

  const supabase = createClient();
  const today = todayStr();
  const dayStart = `${today}T00:00:00`;
  const dayEnd = `${today}T23:59:59`;
  const monthStart = startOfMonth();
  const last30 = startOfLast30Days();

  // ── Tenta usar a view materializada para as métricas principais ──────────────
  // mv_dashboard_metrics é atualizada a cada 15 min via pg_cron em produção.
  // Em desenvolvimento, execute: refresh materialized view concurrently mv_dashboard_metrics;
  let mvRow: MvDashboardMetrics | null = null;
  try {
    const { data } = await supabase
      .from("mv_dashboard_metrics")
      .select("appointments_today, confirmed_today, active_patients, leads_last_30d, revenue_month")
      .eq("clinic_id", safeClinicId)
      .maybeSingle();
    mvRow = (data as MvDashboardMetrics | null) ?? null;
  } catch {
    // View não disponível (ambiente de dev sem refresh, ou plano sem pg_cron).
    // Fallback para queries manuais abaixo.
  }

  // ── Queries manuais para métricas não cobertas pela view ─────────────────────
  const [todayAppts, monthAppts, last30Appts, patientsRes, leadsRes] =
    await Promise.all([
      // Necessário para: pendingConfirmation (não está na MV)
      // Reaproveitado para appointmentsToday / confirmedToday quando MV indisponível
      supabase
        .from("appointments")
        .select("id, status")
        .eq("clinic_id", safeClinicId)
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd),

      supabase
        .from("appointments")
        .select("id")
        .eq("clinic_id", safeClinicId)
        .eq("status", "COMPLETED")
        .gte("starts_at", monthStart),

      supabase
        .from("appointments")
        .select("id, status")
        .eq("clinic_id", safeClinicId)
        .gte("starts_at", last30)
        .in("status", ["COMPLETED", "NO_SHOW", "CONFIRMED", "SCHEDULED"]),

      // Necessário para: patientsThisMonth (não está na MV)
      supabase
        .from("patients")
        .select("id, status, created_at")
        .eq("clinic_id", safeClinicId)
        .eq("status", "ACTIVE"),

      // Necessário para: leadsNew + leadsConversionRate (MV tem count mas não breakdown)
      supabase.from("leads").select("id, status").eq("clinic_id", safeClinicId),
    ]);

  const todayData = todayAppts.data ?? [];
  const monthData = monthAppts.data ?? [];
  const last30Data = last30Appts.data ?? [];
  const patientsData = patientsRes.data ?? [];
  const leadsData = leadsRes.data ?? [];

  // Usa a MV quando disponível; cai nos dados manuais caso contrário
  const appointmentsToday =
    mvRow?.appointments_today ?? todayData.length;
  const appointmentsConfirmedToday =
    mvRow?.confirmed_today ??
    todayData.filter((a) => a.status === "CONFIRMED").length;
  const patientsTotal =
    mvRow?.active_patients ?? patientsData.length;

  const appointmentsPendingConfirmation = todayData.filter(
    (a) => a.status === "SCHEDULED"
  ).length;
  const completedThisMonth = monthData.length;

  const completedLast30 = last30Data.filter(
    (a) => a.status === "COMPLETED"
  ).length;
  const noShowLast30 = last30Data.filter((a) => a.status === "NO_SHOW").length;
  const finishedTotal = completedLast30 + noShowLast30;
  const noShowRate =
    finishedTotal > 0 ? Math.round((noShowLast30 / finishedTotal) * 100) : 0;

  const confirmedLast30 = last30Data.filter(
    (a) => a.status === "CONFIRMED" || a.status === "COMPLETED"
  ).length;
  const scheduledLast30 = last30Data.length;
  const confirmationRate =
    scheduledLast30 > 0
      ? Math.round((confirmedLast30 / scheduledLast30) * 100)
      : 0;

  const patientsThisMonth = patientsData.filter(
    (p) => p.created_at && new Date(p.created_at) >= new Date(monthStart)
  ).length;

  const leadsNew = leadsData.filter((l) => l.status === "NEW").length;
  const leadsConverted = leadsData.filter(
    (l) => l.status === "CONVERTED"
  ).length;
  const leadsTotal = leadsData.length;
  const leadsConversionRate =
    leadsTotal > 0 ? Math.round((leadsConverted / leadsTotal) * 100) : 0;

  const avgAppointmentsPerDay =
    last30Data.length > 0 ? Math.round((last30Data.length / 30) * 10) / 10 : 0;

  return {
    appointmentsToday,
    appointmentsConfirmedToday,
    appointmentsPendingConfirmation,
    completedThisMonth,
    noShowRate,
    confirmationRate,
    patientsTotal,
    patientsThisMonth,
    leadsNew,
    leadsConversionRate,
    avgAppointmentsPerDay,
  };
}

// ── Today's Schedule ─────────────────────────────────────────────────────────

export async function getTodayAppointments(
  clinicId: string
): Promise<TodayAppointment[]> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return [];

  const supabase = createClient();
  const today = todayStr();
  const dayStart = `${today}T00:00:00`;
  const dayEnd = `${today}T23:59:59`;

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, notes, patient_id, professional_id"
    )
    .eq("clinic_id", safeClinicId)
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd)
    .order("starts_at", { ascending: true });

  if (error || !appointments) return [];

  const patientIds = [
    ...new Set(appointments.map((a) => a.patient_id).filter(isNonEmptyString)),
  ];

  const professionalIds = [
    ...new Set(
      appointments.map((a) => a.professional_id).filter(isNonEmptyString)
    ),
  ];

  const [patientsRes, professionalsRes] = await Promise.all([
    patientIds.length > 0
      ? supabase.from("patients").select("id, full_name").in("id", patientIds)
      : Promise.resolve({ data: [], error: null }),
    professionalIds.length > 0
      ? supabase
          .from("professionals")
          .select("id, full_name, color")
          .in("id", professionalIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const patientMap = new Map(
    (patientsRes.data ?? []).map((p) => [p.id, p.full_name])
  );

  const profMap = new Map(
    (professionalsRes.data ?? []).map((p) => [
      p.id,
      { name: p.full_name, color: p.color },
    ])
  );

  return appointments.map((a) => {
    const prof = a.professional_id ? profMap.get(a.professional_id) : null;

    return {
      id: a.id,
      starts_at: a.starts_at,
      ends_at: a.ends_at,
      status: a.status,
      notes: a.notes,
      patient_name: patientMap.get(a.patient_id) ?? "Paciente",
      professional_name: prof?.name ?? null,
      professional_color: prof?.color ?? null,
    };
  });
}

// ── Pending Actions ──────────────────────────────────────────────────────────

export async function getPendingActions(
  clinicId: string
): Promise<PendingAction[]> {
  const safeClinicId = String(clinicId ?? "").trim();
  if (!safeClinicId) return [];

  const supabase = createClient();
  const actions: PendingAction[] = [];
  const today = todayStr();
  const yesterday = yesterdayStr();

  const { data: unconfirmed } = await supabase
    .from("appointments")
    .select("id, starts_at, patient_id")
    .eq("clinic_id", safeClinicId)
    .eq("status", "SCHEDULED")
    .gte("starts_at", `${today}T00:00:00`)
    .lte("starts_at", `${today}T23:59:59`)
    .order("starts_at", { ascending: true })
    .limit(10);

  if (unconfirmed && unconfirmed.length > 0) {
    const patientIds = [
      ...new Set(unconfirmed.map((a) => a.patient_id).filter(isNonEmptyString)),
    ];

    const { data: patients } =
      patientIds.length > 0
        ? await supabase
            .from("patients")
            .select("id, full_name")
            .in("id", patientIds)
        : { data: [] };

    const pMap = new Map((patients ?? []).map((p) => [p.id, p.full_name]));

    for (const appt of unconfirmed) {
      const time = new Date(appt.starts_at);
      const timeStr = Number.isNaN(time.getTime())
        ? ""
        : new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(time);

      actions.push({
        type: "unconfirmed_today",
        id: appt.id,
        label: `Confirmar: ${pMap.get(appt.patient_id) ?? "Paciente"}`,
        sublabel: `Hoje às ${timeStr}`,
        href: `/dashboard/appointments/${appt.id}`,
      });
    }
  }

  const { data: yesterdayMissed } = await supabase
    .from("appointments")
    .select("id, starts_at, patient_id")
    .eq("clinic_id", safeClinicId)
    .eq("status", "CONFIRMED")
    .gte("starts_at", `${yesterday}T00:00:00`)
    .lte("starts_at", `${yesterday}T23:59:59`)
    .limit(10);

  if (yesterdayMissed && yesterdayMissed.length > 0) {
    const patientIds = [
      ...new Set(
        yesterdayMissed.map((a) => a.patient_id).filter(isNonEmptyString)
      ),
    ];

    const { data: patients } =
      patientIds.length > 0
        ? await supabase
            .from("patients")
            .select("id, full_name")
            .in("id", patientIds)
        : { data: [] };

    const pMap = new Map((patients ?? []).map((p) => [p.id, p.full_name]));

    for (const appt of yesterdayMissed) {
      actions.push({
        type: "no_show_yesterday",
        id: appt.id,
        label: `No-show ontem: ${pMap.get(appt.patient_id) ?? "Paciente"}`,
        sublabel: "Marcar como não compareceu?",
        href: `/dashboard/appointments/${appt.id}`,
      });
    }
  }

  const { data: followUps } = await supabase
    .from("follow_ups")
    .select("id, patient_id, scheduled_for, notes")
    .eq("clinic_id", safeClinicId)
    .eq("status", "PENDING")
    .lte("scheduled_for", today)
    .order("scheduled_for", { ascending: true })
    .limit(10);

  if (followUps && followUps.length > 0) {
    const patientIds = [
      ...new Set(followUps.map((f) => f.patient_id).filter(isNonEmptyString)),
    ];

    const { data: patients } =
      patientIds.length > 0
        ? await supabase
            .from("patients")
            .select("id, full_name")
            .in("id", patientIds)
        : { data: [] };

    const pMap = new Map((patients ?? []).map((p) => [p.id, p.full_name]));

    for (const fu of followUps) {
      actions.push({
        type: "follow_up_pending",
        id: fu.id,
        label: `Retorno: ${pMap.get(fu.patient_id) ?? "Paciente"}`,
        sublabel: fu.notes?.slice(0, 60) ?? "Retorno pendente",
        href: `/dashboard/patients/${fu.patient_id}`,
      });
    }
  }

  return actions;
}
