import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { getPatientById } from "@/services/patients.service";
import { updatePatientAction } from "@/app/actions/patients.actions";
import PatientForm from "@/components/patients/PatientForm";

export const dynamic = "force-dynamic";

export default async function EditPatientPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  if (!ctx.clinicId) notFound();

  const patient = await getPatientById(params.id, ctx.clinicId);
  if (!patient) notFound();

  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/patients/${patient.id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          ← Voltar para {patient.full_name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Editar paciente
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Atualize os dados de {patient.full_name}.
        </p>
      </div>

      <PatientForm
        action={updatePatientAction}
        patient={patient}
        backHref={`/dashboard/patients/${patient.id}`}
        submitLabel="Salvar alterações"
        error={error}
      />
    </div>
  );
}
