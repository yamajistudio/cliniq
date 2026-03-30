import Link from "next/link";
import { createPatientAction } from "@/app/actions/patients.actions";
import PatientForm from "@/components/patients/PatientForm";

export default function NewPatientPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          ← Voltar para pacientes
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Novo paciente
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Preencha os dados para cadastrar um novo paciente.
        </p>
      </div>

      <PatientForm
        action={createPatientAction}
        backHref="/dashboard/patients"
        submitLabel="Cadastrar paciente"
        error={error}
      />
    </div>
  );
}
