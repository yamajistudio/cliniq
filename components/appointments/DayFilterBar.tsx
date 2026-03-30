"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ProfessionalRow } from "@/services/professionals.service";

type Props = {
  selectedDate: string;
  selectedProfessional: string;
  professionals: ProfessionalRow[];
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export default function DayFilterBar({
  selectedDate,
  selectedProfessional,
  professionals,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(date: string, professional?: string) {
    const params = new URLSearchParams();
    params.set("date", date);
    const prof = professional ?? selectedProfessional;
    if (prof) params.set("professional", prof);
    router.push(`/dashboard/appointments?${params.toString()}`);
  }

  function handleProfessionalChange(value: string) {
    const params = new URLSearchParams();
    params.set("date", selectedDate);
    if (value) params.set("professional", value);
    router.push(`/dashboard/appointments?${params.toString()}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(addDays(selectedDate, -1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50"
          aria-label="Dia anterior"
        >
          ←
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => navigate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={() => navigate(addDays(selectedDate, 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50"
          aria-label="Próximo dia"
        >
          →
        </button>

        {!isToday(selectedDate) && (
          <button
            type="button"
            onClick={() => navigate(today)}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
          >
            Hoje
          </button>
        )}
      </div>

      {/* Professional filter */}
      <div className="flex items-center gap-2">
        <select
          value={selectedProfessional}
          onChange={(e) => handleProfessionalChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todos profissionais</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>

        {/* Color chips for quick filter */}
        <div className="hidden items-center gap-1 lg:flex">
          {professionals.slice(0, 6).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                handleProfessionalChange(
                  selectedProfessional === p.id ? "" : p.id
                )
              }
              className={[
                "h-5 w-5 rounded-full border-2 transition hover:scale-110",
                selectedProfessional === p.id
                  ? "border-slate-900 scale-110 shadow-md"
                  : "border-white shadow-sm",
              ].join(" ")}
              style={{ backgroundColor: p.color }}
              title={p.full_name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
