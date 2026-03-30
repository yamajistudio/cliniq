import StatCard from "@/components/dashboard/StatCard";
import type { DashboardMetrics } from "@/services/dashboard.service";

type Props = {
  metrics: DashboardMetrics;
};

export default function MetricsGrid({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        title="Consultas hoje"
        value={metrics.appointmentsToday}
        icon={<span>📅</span>}
        tone="blue"
        tag={
          metrics.appointmentsPendingConfirmation > 0
            ? `${metrics.appointmentsPendingConfirmation} sem confirmar`
            : undefined
        }
      />

      <StatCard
        title="Confirmados hoje"
        value={metrics.appointmentsConfirmedToday}
        icon={<span>✓</span>}
        tone="purple"
        tag={
          metrics.confirmationRate > 0
            ? `${metrics.confirmationRate}% taxa`
            : undefined
        }
      />

      <StatCard
        title="Concluídos (mês)"
        value={metrics.completedThisMonth}
        icon={<span>✅</span>}
        tone="green"
        tag={
          metrics.avgAppointmentsPerDay > 0
            ? `~${metrics.avgAppointmentsPerDay}/dia`
            : undefined
        }
      />

      <StatCard
        title="Taxa no-show"
        value={`${metrics.noShowRate}%`}
        icon={<span>⚠️</span>}
        tone={metrics.noShowRate > 15 ? "red" : metrics.noShowRate > 5 ? "orange" : "green"}
        tag="últimos 30 dias"
      />

      <StatCard
        title="Pacientes ativos"
        value={metrics.patientsTotal}
        icon={<span>👤</span>}
        tone="blue"
        tag={
          metrics.patientsThisMonth > 0
            ? `+${metrics.patientsThisMonth} este mês`
            : undefined
        }
      />

      <StatCard
        title="Novos pacientes"
        value={metrics.patientsThisMonth}
        icon={<span>🆕</span>}
        tone="green"
        tag="este mês"
      />

      <StatCard
        title="Leads novos"
        value={metrics.leadsNew}
        icon={<span>🎯</span>}
        tone="orange"
        tag={
          metrics.leadsConversionRate > 0
            ? `${metrics.leadsConversionRate}% conversão`
            : undefined
        }
      />

      <StatCard
        title="Conversão de leads"
        value={`${metrics.leadsConversionRate}%`}
        icon={<span>📈</span>}
        tone={metrics.leadsConversionRate >= 20 ? "green" : "orange"}
        tag="histórico"
      />
    </div>
  );
}
