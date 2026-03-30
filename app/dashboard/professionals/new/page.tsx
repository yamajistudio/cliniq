import Link from "next/link";
import { createProfessionalAction } from "@/app/actions/professionals.actions";
import ProfessionalForm from "@/components/professionals/ProfessionalForm";

export default function NewProfessionalPage({
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
          href="/dashboard/professionals"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          ← Voltar para profissionais
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Novo profissional
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cadastre um médico ou profissional de saúde da clínica.
        </p>
      </div>

      <ProfessionalForm
        action={createProfessionalAction}
        backHref="/dashboard/professionals"
        submitLabel="Cadastrar profissional"
        error={error}
      />
    </div>
  );
}
