"use client";

import { useState } from "react";
import { updateClinicSettingsAction } from "@/app/actions/settings.actions";
import { DAY_NAMES } from "@/lib/constants";

type ClinicSettingsRow = {
  id: string;
  clinic_id: string;
  opening_time: string;
  closing_time: string;
  slot_duration_minutes: number;
  days_open: number[];
  lunch_start: string | null;
  lunch_end: string | null;
  allow_online_booking: boolean;
  timezone: string;
  appointment_buffer_minutes: number;
  updated_at: string | null;
};

type Props = {
  settings: ClinicSettingsRow;
};

export default function ScheduleSettings({ settings }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [daysOpen, setDaysOpen] = useState<number[]>(settings.days_open ?? [1, 2, 3, 4, 5]);

  function toggleDay(day: number) {
    setDaysOpen((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  return (
    <form
      action={updateClinicSettingsAction}
      onSubmit={() => setSubmitting(true)}
      className="rounded-xl border bg-white"
    >
      <div className="border-b bg-slate-50 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Horários de funcionamento
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Configure quando sua clínica atende. Estes horários são usados na agenda.
        </p>
      </div>

      <div className="space-y-6 p-6">
        {/* Opening / Closing */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="opening_time" className="block text-sm font-medium text-slate-700">
              Abertura
            </label>
            <input
              id="opening_time"
              name="opening_time"
              type="time"
              defaultValue={settings.opening_time?.slice(0, 5) ?? "08:00"}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label htmlFor="closing_time" className="block text-sm font-medium text-slate-700">
              Fechamento
            </label>
            <input
              id="closing_time"
              name="closing_time"
              type="time"
              defaultValue={settings.closing_time?.slice(0, 5) ?? "18:00"}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label htmlFor="slot_duration_minutes" className="block text-sm font-medium text-slate-700">
              Duração do slot
            </label>
            <select
              id="slot_duration_minutes"
              name="slot_duration_minutes"
              defaultValue={settings.slot_duration_minutes ?? 30}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value={15}>15 minutos</option>
              <option value={20}>20 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={40}>40 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
            </select>
          </div>
        </div>

        {/* Days open */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Dias de atendimento
          </label>
          <div className="flex flex-wrap gap-2">
            {DAY_NAMES.map((name, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                className={[
                  "rounded-lg border px-3 py-2 text-sm font-medium transition",
                  daysOpen.includes(index)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50",
                ].join(" ")}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
          {/* Hidden inputs for selected days */}
          {daysOpen.map((d) => (
            <input key={d} type="hidden" name="days_open" value={d} />
          ))}
        </div>

        {/* Lunch break */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Intervalo de almoço (opcional)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Horários de almoço serão bloqueados na agenda.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:w-1/2">
            <div>
              <label htmlFor="lunch_start" className="block text-xs text-slate-500">
                Início
              </label>
              <input
                id="lunch_start"
                name="lunch_start"
                type="time"
                defaultValue={settings.lunch_start?.slice(0, 5) ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="lunch_end" className="block text-xs text-slate-500">
                Fim
              </label>
              <input
                id="lunch_end"
                name="lunch_end"
                type="time"
                defaultValue={settings.lunch_end?.slice(0, 5) ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Buffer */}
        <div className="sm:w-1/3">
          <label htmlFor="appointment_buffer_minutes" className="block text-sm font-medium text-slate-700">
            Intervalo entre consultas
          </label>
          <select
            id="appointment_buffer_minutes"
            name="appointment_buffer_minutes"
            defaultValue={settings.appointment_buffer_minutes ?? 0}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value={0}>Sem intervalo</option>
            <option value={5}>5 minutos</option>
            <option value={10}>10 minutos</option>
            <option value={15}>15 minutos</option>
          </select>
        </div>
      </div>

      <div className="border-t px-6 py-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Salvando..." : "Salvar horários"}
        </button>
      </div>
    </form>
  );
}
