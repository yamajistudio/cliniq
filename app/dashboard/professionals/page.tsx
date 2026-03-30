import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { listProfessionals } from "@/services/professionals.service";

export const dynamic = "force-dynamic";

export default async function ProfessionalsPage() {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  let professionals: any[] = [];
  if (ctx.clinicId) {
    try {
      professionals = await listProfessionals(ctx.clinicId);
    } catch {
      professionals = [];
    }
  }

  const active = professionals.filter((p) => p.is_active);
  const inactive = professionals.filter((p) => !p.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profissionais</h1>
          <p className="text-sm text-slate-600">
            {active.length} ativo{active.length !== 1 ? "s" : ""}
            {inactive.length > 0 && ` · ${inactive.length} inativo${inactive.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/dashboard/professionals/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Novo profissional
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/professionals/${p.id}`}
            className={[
              "group rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md",
              !p.is_active ? "opacity-60" : "",
            ].join(" ")}
            style={{ borderLeftWidth: "4px", borderLeftColor: p.color }}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                  {p.full_name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{p.specialty}</p>
              </div>
              <div
                className="ml-3 h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: p.color }}
                title={`Cor: ${p.color}`}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {p.license_number && (
                <span>{p.license_number}</span>
              )}
              {p.phone && <span>{p.phone}</span>}
              {p.email && <span>{p.email}</span>}
            </div>

            <div className="mt-3">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  p.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500",
                ].join(" ")}
              >
                {p.is_active ? "Ativo" : "Inativo"}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {professionals.length === 0 && (
        <div className="rounded-xl border bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 text-4xl">👨‍⚕️</div>
          <p className="text-slate-600">
            Nenhum profissional cadastrado ainda.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre o primeiro profissional para começar a agendar consultas.
          </p>
          <Link
            href="/dashboard/professionals/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Cadastrar profissional
          </Link>
        </div>
      )}
    </div>
  );
}
