import DayColumn from "./DayColumn";
import type { AppointmentStatus } from "@/types/database";

type AppointmentData = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  status: AppointmentStatus;
  patient_id: string;
  professional_id: string | null;
  notes: string | null;
};

type Props = {
  weekDates: string[];
  appointmentsByDate: Record<string, AppointmentData[]>;
  patientMap: Map<string, string>;
  professionalMap: Map<string, { name: string; color: string }>;
  openingTime?: string;
  closingTime?: string;
  slotDuration?: number;
  selectedProfessional?: string;
};

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export default function WeekView({
  weekDates,
  appointmentsByDate,
  patientMap,
  professionalMap,
  openingTime = "08:00",
  closingTime = "18:00",
  slotDuration = 30,
  selectedProfessional = "",
}: Props) {
  const totalSlots = (() => {
    const [oH, oM] = openingTime.split(":").map(Number);
    const [cH, cM] = closingTime.split(":").map(Number);
    const totalMinutes = (cH * 60 + cM) - (oH * 60 + oM);
    return Math.ceil(totalMinutes / slotDuration);
  })();

  const totalAppts = Object.values(appointmentsByDate).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{totalAppts} agendamento{totalAppts !== 1 ? "s" : ""} na semana</span>
        <span>·</span>
        <span>{openingTime} — {closingTime}</span>
        <span>·</span>
        <span>{slotDuration} min/slot</span>
      </div>

      {/* Grid container with horizontal scroll on mobile */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <div className="flex min-w-[1120px]">
          {/* Time gutter */}
          <div className="w-14 flex-shrink-0 border-r bg-slate-50">
            {/* Header spacer */}
            <div className="sticky top-0 z-10 border-b bg-slate-50 px-1 py-2 text-center">
              <p className="text-[10px] text-slate-400">Hora</p>
              <p className="text-xs font-medium text-transparent">00</p>
              <p className="text-[10px] text-transparent">.</p>
            </div>
            {/* Time labels */}
            <div className="divide-y divide-slate-100">
              {Array.from({ length: totalSlots }, (_, i) => {
                const [oH, oM] = openingTime.split(":").map(Number);
                const mins = oH * 60 + oM + i * slotDuration;
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                return (
                  <div key={label} className="flex min-h-[64px] items-start px-1 pt-1">
                    <span className="text-[10px] font-medium text-slate-400">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day columns */}
          {weekDates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              appointments={appointmentsByDate[date] ?? []}
              patientMap={patientMap}
              professionalMap={professionalMap}
              openingTime={openingTime}
              closingTime={closingTime}
              slotDuration={slotDuration}
              isToday={isToday(date)}
              selectedProfessional={selectedProfessional}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
