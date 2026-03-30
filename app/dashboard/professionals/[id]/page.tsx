import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { validateUuid } from "@/lib/validation/ids";
import {
  getProfessionalWithSchedules,
  DAY_LABELS,
} from "@/services/professionals.service";
import { toggleProfessionalActiveAction } from "@/app/actions/professionals.actions";
import ScheduleEditor from "@/components/professionals/ScheduleEditor";

export const dynamic = "force-dynamic";

export default async function ProfessionalDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  if (!validateUuid(params.id)) notFound();

  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  if (!ctx.clinicId) notFound();

  const professional = await getProfessionalWithSchedules(
    params.id,
    ctx.clinicId
  );
  if (!professional) notFound();

  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;

  const activeSchedules = professional.schedules.filter((s) => s.is_active);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/professionals"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
      >
        ← Voltar para profissionais
      </Link>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white shadow-md"
            style={{ backgroundColor: professional.color }}
          >
            {professional.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {professional.full_name}
              </h1>
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  professional.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500",
                ].join(" ")}
              >
                {professional.is_active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {professional.specialty}
              {professional.license_number &&
                ` · ${professional.license_number}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/appointments?professional=${professional.id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            📅 Ver agenda
          </Link>
          <Link
            href={`/dashboard/professionals/${professional.id}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ✏️ Editar
          </Link>
          <form action={toggleProfessionalActiveAction}>
            <input
              type="hidden"
              name="professional_id"
              value={professional.id}
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {professional.is_active ? "⏸️ Desativar" : "▶️ Ativar"}
            </button>
          </form>
        </div>
      </div>

      {/* Dados */}
      <div className="rounded-xl border bg-white">
        <div className="border-b bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Dados do profissional</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Especialidade
            </p>
            <p className="mt-1 text-sm text-slate-900">{professional.specialty}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Registro
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {professional.license_number ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Cor na agenda
            </p>
            <div className="mt-1 flex items-center gap-2">
              <div
                className="h-5 w-5 rounded-full border"
                style={{ backgroundColor: professional.color }}
              />
              <span className="font-mono text-xs text-slate-500">
                {professional.color}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Telefone
            </p>
            <p className="mt-1 text-sm text-slate-900">{professional.phone ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
            </p>
            <p className="mt-1 text-sm text-slate-900">{professional.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Dias de atendimento
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {activeSchedules.length > 0
                ? activeSchedules
                    .map((s) => DAY_LABELS[s.day_of_week]?.slice(0, 3))
                    .join(", ")
                : "Nenhum dia configurado"}
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Editor */}
      <ScheduleEditor
        professionalId={professional.id}
        schedules={professional.schedules}
      />
    </div>
  );
}
