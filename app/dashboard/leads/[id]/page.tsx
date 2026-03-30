import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { getLeadById } from "@/services/leads.service";
import {
  getLeadScoreHistory,
  SCORE_CONFIG,
  SCORE_FACTOR_LABEL,
} from "@/services/lead-scoring.service";
import type { ScoredLeadRow, ScoreHistoryEntry } from "@/services/lead-scoring.service";
import { notFound } from "next/navigation";
import { validateUuid } from "@/lib/validation/ids";
import StatusBadge from "@/components/dashboard/StatusBadge";
import LeadScoreBadge from "@/components/leads/LeadScoreBadge";
import LeadScoreBar from "@/components/leads/LeadScoreBar";
import { LEAD_SOURCE_LABEL } from "@/lib/status";
import { convertLeadAction, updateLeadStatusAction } from "@/app/actions/leads.actions";
import { recalculateScoreAction } from "@/app/actions/lead-scoring.actions";
import { formatarDataHora, formatarDataCurta } from "@/lib/formatting";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string; success?: string };
}) {
  if (!validateUuid(params.id)) notFound();

  const user = await requireUser();
  const ctx  = await getUserContext(user.id);
  if (!ctx.clinicId) notFound();

  const lead = await getLeadById(params.id, ctx.clinicId);
  if (!lead) notFound();

  const errorMsg   = searchParams?.error   ? decodeURIComponent(searchParams.error)   : null;
  const successMsg = searchParams?.success ? decodeURIComponent(searchParams.success) : null;

  let scoreHistory: ScoreHistoryEntry[] = [];
  try {
    scoreHistory = await getLeadScoreHistory(ctx.clinicId, params.id);
  } catch {
    scoreHistory = [];
  }

  const scored = lead as unknown as ScoredLeadRow;
  const hasScore  = typeof scored.score === "number";
  const scoreConf = hasScore
    ? (SCORE_CONFIG[scored.score_label] ?? SCORE_CONFIG.COLD)
    : null;

  const canConvert = lead.status !== "CONVERTED" && lead.status !== "LOST";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/leads"
        className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
      >
        ← Voltar para leads
      </Link>

      {(errorMsg || successMsg) && (
        <div>
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              ✓ {successMsg}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{lead.full_name}</h1>
            <StatusBadge status={lead.status} type="lead" />
            {hasScore && (
              <LeadScoreBadge
                score={scored.score}
                label={scored.score_label}
                factors={scored.score_factors}
              />
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Origem:{" "}
            {(LEAD_SOURCE_LABEL as Record<string, string>)[lead.source] ?? lead.source}
            {" · "}Criado em {formatarDataHora(lead.created_at)}
          </p>
        </div>

        {canConvert && (
          <form action={convertLeadAction}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              ✅ Converter em paciente
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: lead data */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Dados do lead</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Telefone</p>
                <p className="mt-1 text-sm text-slate-900">{lead.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Email</p>
                <p className="mt-1 text-sm text-slate-900">{lead.email || "-"}</p>
              </div>
            </div>

            {lead.notes && (
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-medium uppercase text-slate-500">Observações</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Score history */}
          {scoreHistory.length > 0 && (
            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Histórico de Score
              </h2>
              <div className="space-y-2">
                {scoreHistory.slice(0, 10).map((entry, i) => {
                  const conf = SCORE_CONFIG[entry.score_label] ?? SCORE_CONFIG.COLD;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <span
                        className={[
                          "w-10 rounded-full px-1.5 py-0.5 text-center text-xs font-bold",
                          conf.bgColor,
                          conf.color,
                        ].join(" ")}
                      >
                        {entry.score}
                      </span>
                      <div className="flex-1">
                        <LeadScoreBar score={entry.score} />
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatarDataCurta(entry.created_at)}
                      </span>
                      {entry.trigger_event && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                          {entry.trigger_event.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: score panel */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Score de Qualificação</h2>
              <form action={recalculateScoreAction}>
                <input type="hidden" name="lead_id" value={lead.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Recalcular
                </button>
              </form>
            </div>

            {hasScore ? (
              <div className="mt-4">
                {/* Big score */}
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold text-slate-900">{scored.score}</span>
                  <div className="mb-1">
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-sm font-semibold",
                        scoreConf!.bgColor,
                        scoreConf!.color,
                      ].join(" ")}
                    >
                      {scoreConf!.emoji} {scoreConf!.label}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <LeadScoreBar score={scored.score} showLabel />
                </div>

                {scored.score_updated_at && (
                  <p className="mt-2 text-xs text-slate-400">
                    Atualizado em {formatarDataHora(scored.score_updated_at)}
                  </p>
                )}

                {/* Factor breakdown */}
                {scored.score_factors &&
                  Object.keys(scored.score_factors).length > 0 && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Fatores
                      </p>
                      {Object.entries(scored.score_factors).map(([key, pts]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">
                            {SCORE_FACTOR_LABEL[key] ?? key}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${Math.min(100, ((pts as number) / 25) * 100)}%` }}
                              />
                            </div>
                            <span className="w-6 text-right text-xs font-semibold text-slate-700">
                              +{pts as number}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ) : (
              <div className="mt-4 text-center text-sm text-slate-400">
                <p>Score ainda não calculado.</p>
                <form action={recalculateScoreAction} className="mt-2">
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Calcular agora
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
