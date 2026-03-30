import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/ui/EmptyState";
import { createServiceAction, toggleServiceAction } from "@/app/actions/services.actions";

export const dynamic = "force-dynamic";

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams?: { error?: string; success?: string };
}) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;
  const success = searchParams?.success
    ? decodeURIComponent(searchParams.success)
    : null;

  let services: any[] = [];
  if (ctx.clinicId) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("services_catalog")
        .select("*")
        .eq("clinic_id", ctx.clinicId)
        .order("name", { ascending: true });
      services = data ?? [];
    } catch {
      services = [];
    }
  }

  const active = services.filter((s) => s.is_active);
  const inactive = services.filter((s) => !s.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Serviços</h1>
        <p className="text-sm text-slate-600">
          {active.length} serviço{active.length !== 1 ? "s" : ""} ativo{active.length !== 1 ? "s" : ""}
          {inactive.length > 0 && ` · ${inactive.length} inativo${inactive.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ {success}
        </div>
      )}

      {/* Quick add form */}
      <form
        action={createServiceAction}
        className="rounded-xl border bg-white p-5"
      >
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Adicionar serviço
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="name" className="block text-xs font-medium text-slate-600">
              Nome do serviço *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ex: Consulta, Limpeza, Avaliação..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="w-full sm:w-28">
            <label htmlFor="duration" className="block text-xs font-medium text-slate-600">
              Duração *
            </label>
            <select
              id="duration"
              name="duration_minutes"
              defaultValue={30}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hora</option>
              <option value={90}>1h30</option>
              <option value={120}>2 horas</option>
            </select>
          </div>
          <div className="w-full sm:w-32">
            <label htmlFor="price" className="block text-xs font-medium text-slate-600">
              Preço
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step={0.01}
              placeholder="0,00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Adicionar
          </button>
        </div>
      </form>

      {/* Services list */}
      {services.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="divide-y">
            {services.map((s) => (
              <div
                key={s.id}
                className={[
                  "flex items-center justify-between px-5 py-4",
                  !s.is_active ? "opacity-50" : "",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {s.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {s.duration_minutes} min
                    {s.price ? ` · ${formatPrice(Number(s.price))}` : ""}
                    {s.description ? ` · ${s.description}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      s.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {s.is_active ? "Ativo" : "Inativo"}
                  </span>

                  <form action={toggleServiceAction}>
                    <input type="hidden" name="service_id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-50"
                    >
                      {s.is_active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<span>💉</span>}
          title="Nenhum serviço cadastrado"
          description="Cadastre os procedimentos e serviços que sua clínica oferece. Eles aparecerão como opção ao criar agendamentos."
        />
      )}
    </div>
  );
}
