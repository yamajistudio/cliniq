import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { listLeads } from "@/services/leads.service";
import { listLeadsByScore, SCORE_CONFIG } from "@/services/lead-scoring.service";
import type { ScoredLeadRow } from "@/services/lead-scoring.service";
import type { Database } from "@/types/database";
import StatusBadge from "@/components/dashboard/StatusBadge";
import LeadScoreBadge from "@/components/leads/LeadScoreBadge";
import LeadScoreBar from "@/components/leads/LeadScoreBar";
import { LEAD_STATUS_LABEL, LEAD_SOURCE_LABEL } from "@/lib/status";
import { formatarDataCurta } from "@/lib/formatting";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export const dynamic = "force-dynamic";

const PIPELINE_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: { sort?: string };
}) {
  const user = await requireUser();
  const ctx  = await getUserContext(user.id);

  const sortByScore = searchParams?.sort === "score";

  let leads: (LeadRow | ScoredLeadRow)[] = [];

  if (ctx.clinicId) {
    try {
      if (sortByScore) {
        leads = await listLeadsByScore(ctx.clinicId, { limit: 200 });
      } else {
        leads = await listLeads(ctx.clinicId);
      }
    } catch {
      leads = [];
    }
  }

  const pipeline = Object.fromEntries(
    PIPELINE_STATUSES.map((s) => [s, leads.filter((l) => l.status === s)])
  ) as Record<string, (LeadRow | ScoredLeadRow)[]>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-600">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} no pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort toggle */}
          <div className="flex rounded-lg border bg-white text-sm">
            <Link
              href="/dashboard/leads"
              className={[
                "rounded-l-lg px-3 py-2 font-medium transition",
                !sortByScore
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              Por data
            </Link>
            <Link
              href="/dashboard/leads?sort=score"
              className={[
                "rounded-r-lg px-3 py-2 font-medium transition",
                sortByScore
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              Por score
            </Link>
          </div>

          <Link
            href="/dashboard/leads?modal=new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Novo lead
          </Link>
        </div>
      </div>

      {/* Pipeline columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {PIPELINE_STATUSES.map((status) => {
          const statusLeads = pipeline[status] ?? [];
          return (
            <div key={status} className="rounded-xl border bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-slate-500">
                  {(LEAD_STATUS_LABEL as Record<string, string>)[status] ?? status}
                </h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm">
                  {statusLeads.length}
                </span>
              </div>

              <div className="space-y-2">
                {statusLeads.map((l) => {
                  const scored = l as ScoredLeadRow;
                  const isVeryHot =
                    typeof scored.score_label === "string" &&
                    scored.score_label === "VERY_HOT";
                  const hasScore = typeof scored.score === "number";

                  return (
                    <Link
                      key={l.id}
                      href={`/dashboard/leads/${l.id}`}
                      className={[
                        "block rounded-lg border bg-white p-3 shadow-sm transition hover:shadow-md",
                        isVeryHot ? "border-red-300 ring-1 ring-red-200" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {l.full_name}
                        </p>
                        {hasScore && (
                          <LeadScoreBadge
                            score={scored.score}
                            label={scored.score_label}
                            factors={scored.score_factors}
                            size="sm"
                          />
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {l.phone ?? l.email ?? "Sem contato"}
                      </p>
                      {hasScore && (
                        <div className="mt-2">
                          <LeadScoreBar score={scored.score} />
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {(LEAD_SOURCE_LABEL as Record<string, string>)[l.source] ?? l.source}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatarDataCurta(l.created_at ?? "")}
                        </span>
                      </div>
                    </Link>
                  );
                })}

                {statusLeads.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
                    Nenhum lead
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
