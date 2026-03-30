import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { listPayments, getMonthSummary } from "@/services/payments.service";
import type { PaymentWithNames } from "@/services/payments.service";
import { listPatients } from "@/services/patients.service";
import type { PatientRow } from "@/services/patients.service";
import { markAsPaidAction, createPaymentAction } from "@/app/actions/payments.actions";
import StatCard from "@/components/dashboard/StatCard";
import { PAYMENT_METHODS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

const METHOD_LABEL = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label])
) as Record<string, string>;

export default async function FinanceiroPage({ searchParams }: { searchParams?: { error?: string; success?: string } }) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const success = searchParams?.success ? decodeURIComponent(searchParams.success) : null;

  let payments: PaymentWithNames[] = [];
  let patients: PatientRow[] = [];
  let summary = { totalRevenue: 0, totalPending: 0, paidCount: 0, pendingCount: 0 };

  if (ctx.clinicId) {
    try {
      [payments, summary, patients] = await Promise.all([
        listPayments(ctx.clinicId, { limit: 50 }),
        getMonthSummary(ctx.clinicId),
        listPatients(ctx.clinicId),
      ]);
    } catch { /* empty */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
        <p className="text-sm text-slate-600">Resumo de pagamentos do mês atual.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✓ {success}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Faturamento (mês)" value={fmtCurrency(summary.totalRevenue)} icon={<span>💰</span>} tone="green" />
        <StatCard title="Pendente" value={fmtCurrency(summary.totalPending)} icon={<span>⏳</span>} tone="orange" />
        <StatCard title="Consultas pagas" value={summary.paidCount} icon={<span>✅</span>} tone="blue" />
        <StatCard title="Consultas pendentes" value={summary.pendingCount} icon={<span>📋</span>} tone="red" />
      </div>

      {/* Create payment form */}
      <form action={createPaymentAction} className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Registrar pagamento</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="pay_patient" className="block text-xs font-medium text-slate-600">Paciente *</label>
            <select id="pay_patient" name="patient_id" required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="">Selecione...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-32">
            <label htmlFor="pay_amount" className="block text-xs font-medium text-slate-600">Valor (R$) *</label>
            <input id="pay_amount" name="amount" type="number" min={0.01} step={0.01} required placeholder="0,00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="w-full sm:w-40">
            <label htmlFor="pay_method" className="block text-xs font-medium text-slate-600">Método</label>
            <select id="pay_method" name="payment_method" defaultValue=""
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="">Não informado</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            Registrar
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Pagamentos recentes</h2>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Paciente</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Método</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{p.patient_name}</td>
                  <td className="px-5 py-3 text-slate-700">{fmtCurrency(Number(p.amount))}</td>
                  <td className="px-5 py-3 text-slate-600">{METHOD_LABEL[p.payment_method] ?? p.payment_method ?? "-"}</td>
                  <td className="px-5 py-3">
                    <span className={["rounded-full px-2 py-0.5 text-xs font-medium",
                      p.status === "PAID" ? "bg-green-100 text-green-700" :
                      p.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-500"
                    ].join(" ")}>
                      {p.status === "PAID" ? "Pago" : p.status === "PENDING" ? "Pendente" : "Reembolsado"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(p.paid_at ?? p.created_at)}</td>
                  <td className="px-5 py-3">
                    {p.status === "PENDING" && (
                      <form action={markAsPaidAction} className="flex items-center gap-2">
                        <input type="hidden" name="payment_id" value={p.id} />
                        <select name="payment_method" defaultValue="PIX"
                          className="rounded border border-slate-300 px-2 py-1 text-xs">
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                        <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700">
                          Pagar
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="divide-y md:hidden">
          {payments.map((p) => (
            <div key={p.id} className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-900">{p.patient_name}</span>
                <span className="text-sm font-bold text-slate-900">{fmtCurrency(Number(p.amount))}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{METHOD_LABEL[p.payment_method] ?? "-"}</span>
                <span className={p.status === "PAID" ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                  {p.status === "PAID" ? "Pago" : "Pendente"}
                </span>
              </div>
              {p.status === "PENDING" && (
                <form action={markAsPaidAction} className="flex gap-2 pt-1">
                  <input type="hidden" name="payment_id" value={p.id} />
                  <input type="hidden" name="payment_method" value="PIX" />
                  <button type="submit" className="w-full rounded bg-green-600 py-1.5 text-xs font-medium text-white">Marcar como pago</button>
                </form>
              )}
            </div>
          ))}
        </div>

        {payments.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Nenhum pagamento registrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
