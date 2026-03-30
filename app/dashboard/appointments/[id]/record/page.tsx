import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { getAppointmentById } from "@/services/appointments.service";
import { getPatientById } from "@/services/patients.service";
import { getRecordByAppointment } from "@/services/medical-records.service";
import { saveMedicalRecordAction } from "@/app/actions/medical-records.actions";

export const dynamic = "force-dynamic";

export default async function MedicalRecordPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string; success?: string };
}) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  if (!ctx.clinicId) notFound();

  const appointment = await getAppointmentById(params.id, ctx.clinicId);
  if (!appointment) notFound();

  const [patient, record] = await Promise.all([
    getPatientById(appointment.patient_id, ctx.clinicId).catch(() => null),
    getRecordByAppointment(params.id, ctx.clinicId).catch(() => null),
  ]);

  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const success = searchParams?.success ? decodeURIComponent(searchParams.success) : null;

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/appointments/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← Voltar para consulta
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prontuário</h1>
        <p className="text-sm text-slate-600">
          {patient?.full_name ?? "Paciente"} — Consulta de{" "}
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(appointment.starts_at))}
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✓ {success}</div>}

      <form action={saveMedicalRecordAction} className="max-w-3xl rounded-xl border bg-white">
        <input type="hidden" name="appointment_id" value={params.id} />

        {/* Patient quick info */}
        {patient && (
          <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                {patient.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{patient.full_name}</p>
                <p className="text-xs text-slate-500">{patient.phone ?? patient.email ?? ""}</p>
              </div>
            </div>
            <Link
              href={`/dashboard/patients/${patient.id}`}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Ver prontuários anteriores →
            </Link>
          </div>
        )}

        <div className="space-y-5 p-6">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              Anotações da consulta
            </label>
            <textarea id="notes" name="notes" rows={5} defaultValue={record?.notes ?? ""}
              placeholder="Queixa principal, exame físico, observações..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-slate-700">
              Diagnóstico
            </label>
            <textarea id="diagnosis" name="diagnosis" rows={3} defaultValue={record?.diagnosis ?? ""}
              placeholder="Diagnóstico ou hipótese diagnóstica..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label htmlFor="prescription" className="block text-sm font-medium text-slate-700">
              Prescrição
            </label>
            <textarea id="prescription" name="prescription" rows={4} defaultValue={record?.prescription ?? ""}
              placeholder="Medicamentos, orientações, pedidos de exames..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t px-6 py-4">
          <button type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            {record ? "Atualizar prontuário" : "Salvar prontuário"}
          </button>
          <Link href={`/dashboard/appointments/${params.id}`}
            className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
