import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { listPatients } from "@/services/patients.service";
import { listProfessionals } from "@/services/professionals.service";
import { createAppointmentAction } from "@/app/actions/appointments.actions";

export const dynamic = "force-dynamic";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
    patient_id?: string;
    professional_id?: string;
    date?: string;
    time?: string;
  };
}) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;
  const preselectedPatientId = searchParams?.patient_id ?? "";
  const preselectedProfessionalId = searchParams?.professional_id ?? "";
  const preselectedDate = searchParams?.date ?? "";
  const preselectedTime = searchParams?.time ?? "";

  const defaultStartsAt =
    preselectedDate && preselectedTime
      ? `${preselectedDate}T${preselectedTime}`
      : preselectedDate
      ? `${preselectedDate}T09:00`
      : "";

  let patients: any[] = [];
  let professionals: any[] = [];

  if (ctx.clinicId) {
    try {
      [patients, professionals] = await Promise.all([
        listPatients(ctx.clinicId),
        listProfessionals(ctx.clinicId, { activeOnly: true }),
      ]);
    } catch {
      patients = [];
      professionals = [];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          ← Voltar para agendamentos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Novo agendamento
        </h1>
      </div>

      <form
        action={createAppointmentAction}
        className="max-w-2xl space-y-5 rounded-xl border bg-white p-6"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Paciente */}
        <div>
          <label
            htmlFor="patient_id"
            className="block text-sm font-medium text-slate-700"
          >
            Paciente <span className="text-red-500">*</span>
          </label>
          <select
            id="patient_id"
            name="patient_id"
            required
            defaultValue={preselectedPatientId}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Selecione o paciente...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
                {p.phone ? ` — ${p.phone}` : ""}
              </option>
            ))}
          </select>
          {patients.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Nenhum paciente cadastrado.{" "}
              <Link
                href="/dashboard/patients/new"
                className="text-blue-600 hover:underline"
              >
                Cadastrar paciente
              </Link>
            </p>
          )}
        </div>

        {/* Profissional */}
        <div>
          <label
            htmlFor="professional_id"
            className="block text-sm font-medium text-slate-700"
          >
            Profissional
          </label>
          <select
            id="professional_id"
            name="professional_id"
            defaultValue={preselectedProfessionalId}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Selecione o profissional...</option>
            {professionals.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.full_name} — {pr.specialty}
              </option>
            ))}
          </select>
          {professionals.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Nenhum profissional cadastrado.{" "}
              <Link
                href="/dashboard/professionals/new"
                className="text-blue-600 hover:underline"
              >
                Cadastrar profissional
              </Link>
            </p>
          )}
        </div>

        {/* Data/hora */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="starts_at"
              className="block text-sm font-medium text-slate-700"
            >
              Data e hora <span className="text-red-500">*</span>
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              required
              defaultValue={defaultStartsAt}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="ends_at"
              className="block text-sm font-medium text-slate-700"
            >
              Término (opcional)
            </label>
            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Observações */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-slate-700"
          >
            Observações
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Motivo da consulta, observações..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t pt-5">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Criar agendamento
          </button>
          <Link
            href="/dashboard/appointments"
            className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
