import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { listPatients, getPatientStats } from "@/services/patients.service";
import PatientList from "@/components/patients/PatientList";
import StatCard from "@/components/dashboard/StatCard";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  let patients: any[] = [];
  let stats = { total: 0, active: 0, inactive: 0, createdThisMonth: 0 };

  if (ctx.clinicId) {
    try {
      [patients, stats] = await Promise.all([
        listPatients(ctx.clinicId),
        getPatientStats(ctx.clinicId),
      ]);
    } catch {
      patients = [];
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-600">
            Gerencie o cadastro de pacientes da clínica.
          </p>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Novo paciente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<span>👥</span>}
          tone="blue"
        />
        <StatCard
          title="Ativos"
          value={stats.active}
          icon={<span>✅</span>}
          tone="green"
        />
        <StatCard
          title="Inativos"
          value={stats.inactive}
          icon={<span>⏸️</span>}
          tone="orange"
        />
        <StatCard
          title="Novos este mês"
          value={stats.createdThisMonth}
          icon={<span>🆕</span>}
          tone="purple"
        />
      </div>

      {/* List */}
      <PatientList patients={patients} />
    </div>
  );
}
