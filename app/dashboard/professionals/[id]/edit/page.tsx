import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { getProfessionalById } from "@/services/professionals.service";
import { updateProfessionalAction } from "@/app/actions/professionals.actions";
import ProfessionalForm from "@/components/professionals/ProfessionalForm";

export const dynamic = "force-dynamic";

export default async function EditProfessionalPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);
  if (!ctx.clinicId) notFound();

  const professional = await getProfessionalById(params.id, ctx.clinicId);
  if (!professional) notFound();

  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/professionals/${professional.id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
        >
          ← Voltar para {professional.full_name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Editar profissional
        </h1>
      </div>

      <ProfessionalForm
        action={updateProfessionalAction}
        professional={professional}
        backHref={`/dashboard/professionals/${professional.id}`}
        submitLabel="Salvar alterações"
        error={error}
      />
    </div>
  );
}
