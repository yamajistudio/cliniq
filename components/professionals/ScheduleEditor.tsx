"use client";

import { useState } from "react";
import { saveScheduleAction } from "@/app/actions/professionals.actions";
import { DAY_LABELS } from "@/lib/constants";

type ScheduleRow = {
  id: string;
  professional_id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type Props = {
  professionalId: string;
  schedules: ScheduleRow[];
};

type DaySchedule = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
};

const DEFAULT_START = "08:00";
const DEFAULT_END = "18:00";
const DEFAULT_SLOT = 30;

function buildInitialSchedules(existing: ScheduleRow[]): DaySchedule[] {
  const map = new Map(existing.map((s) => [s.day_of_week, s]));

  return Array.from({ length: 7 }, (_, i) => {
    const s = map.get(i);
    return {
      day_of_week: i,
      start_time: s?.start_time?.slice(0, 5) ?? DEFAULT_START,
      end_time: s?.end_time?.slice(0, 5) ?? DEFAULT_END,
      slot_duration_minutes: s?.slot_duration_minutes ?? DEFAULT_SLOT,
      is_active: s?.is_active ?? (i >= 1 && i <= 5), // seg-sex por default
    };
  });
}

export default function ScheduleEditor({ professionalId, schedules }: Props) {
  const [days, setDays] = useState<DaySchedule[]>(
    buildInitialSchedules(schedules)
  );
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateDay(index: number, patch: Partial<DaySchedule>) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
    setSaved(false);
  }

  function handleSubmit() {
    setSubmitting(true);
    setSaved(false);
  }

  return (
    <form
      action={saveScheduleAction}
      onSubmit={handleSubmit}
      className="rounded-xl border bg-white"
    >
      <input type="hidden" name="professional_id" value={professionalId} />
      <input
        type="hidden"
        name="schedules_json"
        value={JSON.stringify(days)}
      />

      <div className="border-b bg-slate-50 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Horários de atendimento
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Defina os dias e horários em que este profissional atende.
        </p>
      </div>

      <div className="divide-y">
        {days.map((day, index) => (
          <div
            key={day.day_of_week}
            className={[
              "flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:gap-4",
              day.is_active ? "" : "opacity-50",
            ].join(" ")}
          >
            {/* Toggle + Label */}
            <div className="flex items-center gap-3 sm:w-36">
              <button
                type="button"
                onClick={() => updateDay(index, { is_active: !day.is_active })}
                className={[
                  "relative h-6 w-11 rounded-full transition-colors",
                  day.is_active ? "bg-blue-600" : "bg-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    day.is_active ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
              <span className="text-sm font-medium text-slate-700">
                {DAY_LABELS[day.day_of_week]}
              </span>
            </div>

            {/* Time inputs */}
            {day.is_active && (
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">De</label>
                  <input
                    type="time"
                    value={day.start_time}
                    onChange={(e) =>
                      updateDay(index, { start_time: e.target.value })
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">Até</label>
                  <input
                    type="time"
                    value={day.end_time}
                    onChange={(e) =>
                      updateDay(index, { end_time: e.target.value })
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">Duração</label>
                  <select
                    value={day.slot_duration_minutes}
                    onChange={(e) =>
                      updateDay(index, {
                        slot_duration_minutes: Number(e.target.value),
                      })
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                    <option value={40}>40 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h30</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
              </div>
            )}

            {!day.is_active && (
              <p className="text-xs text-slate-400 italic">Não atende</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t px-6 py-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Salvando..." : "Salvar horários"}
        </button>
        {saved && (
          <span className="text-sm text-green-600">✓ Horários salvos</span>
        )}
      </div>
    </form>
  );
}
