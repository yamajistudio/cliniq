import Link from "next/link";
import type { PendingAction } from "@/services/dashboard.service";

type Props = {
  actions: PendingAction[];
};

const ICONS: Record<string, string> = {
  no_show_yesterday: "🔴",
  unconfirmed_today: "🟡",
  follow_up_pending: "🔵",
};

const TYPE_LABELS: Record<string, string> = {
  no_show_yesterday: "No-show",
  unconfirmed_today: "Sem confirmar",
  follow_up_pending: "Retorno",
};

export default function PendingActions({ actions }: Props) {
  if (actions.length === 0) {
    return (
      <div className="rounded-xl border bg-white px-6 py-8 text-center">
        <div className="mb-2 text-2xl">✅</div>
        <p className="text-sm text-slate-500">
          Nenhuma pendência no momento.
        </p>
      </div>
    );
  }

  // Group by type
  const grouped = new Map<string, PendingAction[]>();
  for (const action of actions) {
    if (!grouped.has(action.type)) grouped.set(action.type, []);
    grouped.get(action.type)!.push(action);
  }

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Pendências ({actions.length})
        </h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
          {actions.length}
        </span>
      </div>

      <div className="divide-y">
        {actions.map((action) => (
          <Link
            key={`${action.type}-${action.id}`}
            href={action.href}
            className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
          >
            <span className="flex-shrink-0 text-base">
              {ICONS[action.type] ?? "⚪"}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {action.label}
              </p>
              <p className="truncate text-xs text-slate-500">
                {action.sublabel}
              </p>
            </div>

            <span className="flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {TYPE_LABELS[action.type] ?? action.type}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
