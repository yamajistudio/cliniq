import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { getPatientWithAppointments } from "@/services/patients.service";
import { validateUuid } from "@/lib/validation/ids";
import { listRecordsByPatient } from "@/services/medical-records.service";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { LEAD_SOURCE_LABEL } from "@/lib/status";
import {
  togglePatientStatusAction,
  deletePatientAction,
} from "@/app/actions/patients.actions";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/status";

export const dynamic = "force-dynamic";

function fmt(valor?: string | null) {
  if (!valor) return "-";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

function fmtHora(valor?: string | null) {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(d);
}

function fmtCpf(cpf: string | null) {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function fmtPhone(phone: string | null) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

const GENDER_LABEL: Record<string, string> = {
  M: "Masculino",
  F: "Feminino",
  NB: "Não-binário",
  O: "Outro",
  NI: "Prefiro não informar",
};

function calcAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} anos`;
}

export default async function PatientDetailPage({
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

  const patient = await getPatientWithAppointments(params.id, ctx.clinicId);
  if (!patient) notFound();

  const records = await listRecordsByPatient(params.id, ctx.clinicId).catch(() => []);

  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;

  const age = calcAge(patient.birth_date);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
      >
        ← Voltar para pacientes
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
            <h1 className="text-2xl font-bold text-slate-900">
              {patient.full_name}
            </h1>
            <StatusBadge status={patient.status} type="patient" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Cadastrado em {fmt(patient.created_at)}
            {patient.totalAppointments > 0 &&
              ` · ${patient.totalAppointments} consulta${patient.totalAppointments !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/appointments/new?patient_id=${patient.id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            📅 Agendar consulta
          </Link>
          <Link
            href={`/dashboard/patients/${patient.id}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ✏️ Editar
          </Link>
          <form action={togglePatientStatusAction}>
            <input type="hidden" name="patient_id" value={patient.id} />
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {patient.status === "ACTIVE" ? "⏸️ Inativar" : "▶️ Reativar"}
            </button>
          </form>
        </div>
      </div>

      {/* Dados do paciente */}
      <div className="rounded-xl border bg-white">
        <div className="border-b bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Dados pessoais
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              CPF
            </p>
            <p className="mt-1 font-mono text-sm text-slate-900">
              {fmtCpf(patient.cpf)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Telefone
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {fmtPhone(patient.phone)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {patient.email ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Data de nascimento
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {fmt(patient.birth_date)}
              {age && (
                <span className="ml-1 text-slate-500">({age})</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Gênero
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {patient.gender
                ? GENDER_LABEL[patient.gender] ?? patient.gender
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Origem
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {patient.source
                ? (LEAD_SOURCE_LABEL as Record<string, string>)[
                    patient.source
                  ] ?? patient.source
                : "-"}
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Endereço
            </p>
            <p className="mt-1 text-sm text-slate-900">
              {patient.address ?? "-"}
            </p>
          </div>
        </div>

        {patient.notes && (
          <div className="border-t px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Observações
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
              {patient.notes}
            </p>
          </div>
        )}
      </div>

      {/* Histórico de consultas */}
      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Histórico de consultas ({patient.totalAppointments})
          </h2>
          <Link
            href={`/dashboard/appointments/new?patient_id=${patient.id}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            + Nova consulta
          </Link>
        </div>

        {patient.appointments.length > 0 ? (
          <div className="divide-y">
            {patient.appointments.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/appointments/${a.id}`}
                className="flex items-center justify-between px-6 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                    {fmtHora(a.starts_at) || "—"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {fmt(a.starts_at)}
                      {a.ends_at && ` — ${fmtHora(a.ends_at)}`}
                    </p>
                    {a.notes && (
                      <p className="mt-0.5 truncate text-xs text-slate-500 max-w-[300px]">
                        {a.notes}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge status={a.status} type="appointment" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              Este paciente ainda não possui consultas registradas.
            </p>
            <Link
              href={`/dashboard/appointments/new?patient_id=${patient.id}`}
              className="mt-2 inline-flex text-sm font-medium text-blue-600 hover:underline"
            >
              Agendar primeira consulta
            </Link>
          </div>
        )}
      </div>

      {/* Medical Records History */}
      {records.length > 0 && (
        <div className="rounded-xl border bg-white">
          <div className="border-b bg-slate-50 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Prontuários ({records.length})
            </h2>
          </div>
          <div className="divide-y">
            {records.slice(0, 10).map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/appointments/${r.appointment_id}/record`}
                className="block px-6 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    {r.diagnosis && (
                      <p className="text-sm font-medium text-slate-900">{r.diagnosis}</p>
                    )}
                    {r.notes && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">{r.notes.slice(0, 120)}</p>
                    )}
                    {r.prescription && (
                      <p className="mt-0.5 truncate text-xs text-slate-400">💊 {r.prescription.slice(0, 80)}</p>
                    )}
                  </div>
                  <span className="ml-3 flex-shrink-0 text-xs text-slate-400">
                    {r.created_at
                      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(r.created_at))
                      : "-"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Zona de perigo */}
      <div className="rounded-xl border border-red-200 bg-red-50/50">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold text-red-800">Zona de perigo</h2>
          <p className="mt-1 text-xs text-red-600">
            Excluir o paciente remove todos os dados associados. Esta ação é irreversível.
          </p>
          <form action={deletePatientAction} className="mt-3">
            <input type="hidden" name="patient_id" value={patient.id} />
            <button
              type="submit"
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
              onClick={(e) => {
                if (
                  !window.confirm(
                    `Tem certeza que deseja excluir o paciente "${patient.full_name}"?`
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              🗑️ Excluir paciente
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
