import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { listPlans } from "@/services/subscription.service";

export const dynamic = "force-dynamic";

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default async function SubscriptionExpiredPage() {
  await requireUser();
  const plans = await listPlans();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 text-5xl">⏰</div>
          <h1 className="text-3xl font-bold text-slate-900">
            Seu período de teste expirou
          </h1>
          <p className="mt-2 text-slate-600">
            Escolha um plano para continuar usando o CRM Clínicas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={[
                "rounded-2xl border p-6",
                index === 1 ? "border-blue-500 bg-blue-50/50 shadow-lg ring-2 ring-blue-500" : "bg-white",
              ].join(" ")}
            >
              {index === 1 && (
                <span className="mb-3 inline-block rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white">
                  Mais popular
                </span>
              )}
              <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">{fmtCurrency(plan.price)}</span>
                <span className="text-sm text-slate-500">/mês</span>
              </div>

              <ul className="mt-4 space-y-2">
                <li className="text-sm text-slate-600">Até {plan.max_professionals} profissionais</li>
                <li className="text-sm text-slate-600">Até {plan.max_patients} pacientes</li>
                <li className="text-sm text-slate-600">{plan.max_appointments_month} agendamentos/mês</li>
                {(plan.features as string[]).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>

              <button
                className={[
                  "mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition",
                  index === 1
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                Assinar {plan.name}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Dúvidas? Entre em contato pelo{" "}
          <a href="mailto:suporte@crmclinicas.com" className="text-blue-600 hover:underline">
            suporte@crmclinicas.com
          </a>
        </p>
      </div>
    </div>
  );
}
