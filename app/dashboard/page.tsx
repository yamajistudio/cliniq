import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import {
  getDashboardMetrics,
  getTodayAppointments,
  getPendingActions,
} from "@/services/dashboard.service";
import { getOnboardingStatus } from "@/services/onboarding.service";
import { getSubscriptionStatus } from "@/services/subscription.service";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import TodaySchedule from "@/components/dashboard/TodaySchedule";
import PendingActions from "@/components/dashboard/PendingActions";
import OnboardingBanner from "@/components/onboarding/OnboardingBanner";

export const dynamic = "force-dynamic";

function nameFromEmail(email?: string | null) {
  if (!email) return "usuário";
  const name = email.split("@")[0] ?? "usuário";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function todayFormatted(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default async function DashboardPage() {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  const name = nameFromEmail(user.email);

  let metrics = null;
  let todayAppointments: any[] = [];
  let pendingActions: any[] = [];
  let onboarding = null;
  let subscription = null;

  if (ctx.clinicId) {
    try {
      [metrics, todayAppointments, pendingActions, onboarding, subscription] = await Promise.all([
        getDashboardMetrics(ctx.clinicId),
        getTodayAppointments(ctx.clinicId),
        getPendingActions(ctx.clinicId),
        getOnboardingStatus(ctx.clinicId),
        getSubscriptionStatus(ctx.clinicId),
      ]);
    } catch {
      metrics = null;
      todayAppointments = [];
      pendingActions = [];
      onboarding = null;
      subscription = null;
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {greeting()}, {name}!
          </h1>
          <p className="mt-1 text-sm text-slate-500 capitalize">
            {todayFormatted()}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
          >
            📅 Novo agendamento
          </Link>
          <Link
            href="/dashboard/patients/new"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 sm:w-auto"
          >
            👤 Novo paciente
          </Link>
        </div>
      </section>

      {/* Onboarding Banner */}
      {onboarding && !onboarding.isComplete && (
        <OnboardingBanner status={onboarding} />
      )}

      {/* Trial Banner */}
      {subscription?.isTrial && subscription.daysRemaining !== null && (
        <div className={[
          "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
          subscription.daysRemaining <= 3
            ? "border-red-200 bg-red-50"
            : subscription.daysRemaining <= 7
            ? "border-amber-200 bg-amber-50"
            : "border-blue-200 bg-blue-50"
        ].join(" ")}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{subscription.daysRemaining <= 3 ? "⚠️" : "⏰"}</span>
            <div>
              <p className={[
                "text-sm font-semibold",
                subscription.daysRemaining <= 3 ? "text-red-800" : "text-slate-900"
              ].join(" ")}>
                {subscription.daysRemaining <= 0
                  ? "Seu trial expirou"
                  : `${subscription.daysRemaining} dia${subscription.daysRemaining !== 1 ? "s" : ""} restante${subscription.daysRemaining !== 1 ? "s" : ""} no trial`}
              </p>
              <p className="text-xs text-slate-600">
                Plano {subscription.plan?.name ?? "Starter"} · Faça upgrade para continuar usando após o trial.
              </p>
            </div>
          </div>
          <Link
            href="/subscription-expired"
            className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ver planos
          </Link>
        </div>
      )}

      {/* Metrics */}
      {metrics && <MetricsGrid metrics={metrics} />}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Today's schedule - wider */}
        <div className="lg:col-span-3">
          <TodaySchedule appointments={todayAppointments} />
        </div>

        {/* Pending actions - narrower */}
        <div className="lg:col-span-2">
          <PendingActions actions={pendingActions} />
        </div>
      </div>

      {/* Quick links */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/appointments"
          className="rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
        >
          <div className="mb-2 text-xl">📅</div>
          <h3 className="font-semibold text-slate-900">Agenda</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Visualizar e gerenciar consultas
          </p>
        </Link>

        <Link
          href="/dashboard/patients"
          className="rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
        >
          <div className="mb-2 text-xl">👤</div>
          <h3 className="font-semibold text-slate-900">Pacientes</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Cadastro, busca e histórico
          </p>
        </Link>

        <Link
          href="/dashboard/leads"
          className="rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
        >
          <div className="mb-2 text-xl">🎯</div>
          <h3 className="font-semibold text-slate-900">Leads</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Pipeline de captação
          </p>
        </Link>

        <Link
          href="/dashboard/professionals"
          className="rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
        >
          <div className="mb-2 text-xl">👨‍⚕️</div>
          <h3 className="font-semibold text-slate-900">Profissionais</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Equipe e horários
          </p>
        </Link>
      </section>
    </div>
  );
}
