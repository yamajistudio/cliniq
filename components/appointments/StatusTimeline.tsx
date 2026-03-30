import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_COLOR,
} from "@/lib/status";
import type { HistoryWithActor } from "@/services/appointment-history.service";

type Props = {
  history: HistoryWithActor[];
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function statusLabel(status: string | null): string {
  if (!status) return "Criação";
  return (
    (APPOINTMENT_STATUS_LABEL as Record<string, string>)[status] ?? status
  );
}

function statusColor(status: string | null): string {
  if (!status) return "#94A3B8";
  return (
    (APPOINTMENT_STATUS_COLOR as Record<string, string>)[status] ?? "#94A3B8"
  );
}

export default function StatusTimeline({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border bg-white px-6 py-8 text-center text-sm text-slate-500">
        Nenhuma transição de status registrada.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white">
      <div className="border-b bg-slate-50 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Histórico de status
        </h2>
      </div>

      <div className="px-6 py-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />

          <div className="space-y-4">
            {history.map((entry, index) => {
              const toColor = statusColor(entry.to_status);
              const isLast = index === history.length - 1;

              return (
                <div key={entry.id} className="relative flex gap-4">
                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={[
                        "h-6 w-6 rounded-full border-2 bg-white",
                        isLast ? "ring-2 ring-offset-1" : "",
                      ].join(" ")}
                      style={{
                        borderColor: toColor,
                        ...(isLast ? { ringColor: `${toColor}40` } : {}),
                      }}
                    >
                      <div
                        className="m-1 h-2 w-2 rounded-full"
                        style={{ backgroundColor: toColor }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.from_status && (
                        <>
                          <span
                            className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              borderColor: statusColor(entry.from_status),
                              color: statusColor(entry.from_status),
                            }}
                          >
                            {statusLabel(entry.from_status)}
                          </span>
                          <span className="text-xs text-slate-400">→</span>
                        </>
                      )}
                      <span
                        className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          borderColor: toColor,
                          color: toColor,
                          backgroundColor: `${toColor}10`,
                        }}
                      >
                        {statusLabel(entry.to_status)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(entry.created_at)}
                      {entry.actor_name && (
                        <span className="ml-1 text-slate-400">
                          por {entry.actor_name}
                        </span>
                      )}
                    </p>

                    {entry.reason && (
                      <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600 italic">
                        {entry.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
