"use client";

import { useRouter } from "next/navigation";

type Props = {
  weekStart: string;
  selectedProfessional: string;
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(startStr: string): string {
  const start = new Date(startStr + "T12:00:00");
  const end = new Date(startStr + "T12:00:00");
  end.setDate(end.getDate() + 6);

  const fmtDay = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { day: "numeric" }).format(d);
  const fmtMonth = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d);

  if (start.getMonth() === end.getMonth()) {
    return `${fmtDay(start)} — ${fmtDay(end)} de ${fmtMonth(start)} ${start.getFullYear()}`;
  }
  return `${fmtDay(start)} ${fmtMonth(start)} — ${fmtDay(end)} ${fmtMonth(end)} ${end.getFullYear()}`;
}

function isCurrentWeek(weekStart: string): boolean {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + diff);
  return monday.toISOString().slice(0, 10) === weekStart;
}

function getThisMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  return now.toISOString().slice(0, 10);
}

export default function WeekNavigator({
  weekStart,
  selectedProfessional,
}: Props) {
  const router = useRouter();

  function navigate(newStart: string) {
    const params = new URLSearchParams();
    params.set("view", "week");
    params.set("week", newStart);
    if (selectedProfessional) params.set("professional", selectedProfessional);
    router.push(`/dashboard/appointments?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => navigate(addDays(weekStart, -7))}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50"
        aria-label="Semana anterior"
      >
        ←
      </button>

      <div className="min-w-[200px] text-center">
        <span className="text-sm font-medium text-slate-900 capitalize">
          {formatWeekLabel(weekStart)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => navigate(addDays(weekStart, 7))}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50"
        aria-label="Próxima semana"
      >
        →
      </button>

      {!isCurrentWeek(weekStart) && (
        <button
          type="button"
          onClick={() => navigate(getThisMonday())}
          className="ml-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
        >
          Esta semana
        </button>
      )}
    </div>
  );
}
