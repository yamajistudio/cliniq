import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { getAppointmentById } from "@/services/appointments.service";
import { getPatientById } from "@/services/patients.service";
import { getProfessionalById } from "@/services/professionals.service";
import { listStatusHistory } from "@/services/appointment-history.service";
import { validateUuid } from "@/lib/validation/ids";
import StatusDropdown from "@/components/appointments/StatusDropdown";
import StatusTimeline from "@/components/appointments/StatusTimeline";
import { confirmAppointmentAction } from "@/app/actions/appointments.actions";
import {
  APPOINTMENT_STATUS_COLOR,
  APPOINTMENT_STATUS_LABEL,
} from "@/lib/status";
import type { AppointmentStatus } from "@/types/database";

export const dynamic = "force-dynamic";

function fmtDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(d);
}

export default async function AppointmentDetailPage({
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

  const appointment = await getAppointmentById(params.id, ctx.clinicId);
  if (!appointment) notFound();

  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;

  // Parallel data fetches
  const [patient, professional, history] = await Promise.all([
    getPatientById(appointment.patient_id, ctx.clinicId).catch(() => null),
    appointment.professional_id
      ? getProfessionalById(appointment.professional_id, ctx.clinicId).catch(
          () => null
        )
      : Promise.resolve(null),
    listStatusHistory(appointment.id, ctx.clinicId).catch(() => []),
  ]);

  const status = appointment.status as AppointmentStatus;
  const statusColor = APPOINTMENT_STATUS_COLOR[status] ?? "#94A3B8";
  const statusLabel = APPOINTMENT_STATUS_LABEL[status] ?? status;
  const canConfirm = status === "SCHEDULED";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
      >
        ← Voltar para agenda
      </Link>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Agendamento</h1>
            <StatusDropdown
              appointmentId={appointment.id}
              currentStatus={status}
              size="md"
            />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {fmtDateTime(appointment.starts_at)}
            {appointment.ends_at && ` — ${fmtTime(appointment.ends_at)}`}
          </p>
          {appointment.confirmed_at && (
            <p className="mt-0.5 text-xs text-green-600">
              ✓ Confirmado em {fmtDateTime(appointment.confirmed_at)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {canConfirm && (
            <form action={confirmAppointmentAction}>
              <input
                type="hidden"
                name="appointment_id"
                value={appointment.id}
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                ✓ Confirmar consulta
              </button>
            </form>
          )}
          <Link
            href={`/dashboard/appointments?date=${appointment.starts_at.slice(0, 10)}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            📅 Ver dia na agenda
          </Link>
          <Link
            href={`/dashboard/appointments/${appointment.id}/record`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            📋 Prontuário
          </Link>
        </div>
      </div>

      {/* Info cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Patient card */}
        <div className="rounded-xl border bg-white">
          <div className="border-b bg-slate-50 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Paciente
            </h2>
          </div>
          {patient ? (
            <div className="p-5">
              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                {patient.full_name}
              </Link>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                {patient.phone && <p>📞 {patient.phone}</p>}
                {patient.email && <p>✉️ {patient.email}</p>}
                {patient.cpf && <p>🪪 {patient.cpf}</p>}
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-400">
              Paciente não encontrado
            </div>
          )}
        </div>

        {/* Professional card */}
        <div className="rounded-xl border bg-white">
          <div className="border-b bg-slate-50 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Profissional
            </h2>
          </div>
          {professional ? (
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: professional.color }}
                >
                  {professional.full_name.charAt(0)}
                </div>
                <div>
                  <Link
                    href={`/dashboard/professionals/${professional.id}`}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    {professional.full_name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {professional.specialty}
                    {professional.license_number &&
                      ` · ${professional.license_number}`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-400">
              Nenhum profissional vinculado
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border bg-white">
        <div className="border-b bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Detalhes do agendamento
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Data
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {fmtDate(appointment.starts_at)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Horário
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {fmtTime(appointment.starts_at)}
              {appointment.ends_at && ` — ${fmtTime(appointment.ends_at)}`}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Status
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-sm text-slate-900">{statusLabel}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Criado em
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {fmtDateTime(appointment.created_at)}
            </p>
          </div>
          {appointment.confirmed_at && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Confirmado em
              </p>
              <p className="mt-1 text-sm text-slate-900">
                {fmtDateTime(appointment.confirmed_at)}
              </p>
            </div>
          )}
        </div>

        {appointment.notes && (
          <div className="border-t px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Observações
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
              {appointment.notes}
            </p>
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <StatusTimeline history={history} />
    </div>
  );
}
