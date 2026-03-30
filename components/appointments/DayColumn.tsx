import Link from "next/link";
import AppointmentCard from "./AppointmentCard";
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
  date: string;
  appointments: AppointmentData[];
  patientMap: Map<string, string>;
  professionalMap: Map<string, { name: string; color: string }>;
  openingTime?: string;
  closingTime?: string;
  slotDuration?: number;
  isToday?: boolean;
  selectedProfessional?: string;
};

function formatDayHeader(dateStr: string): { dayName: string; dayNum: string; monthShort: string } {
  const d = new Date(dateStr + "T12:00:00");
  const dayName = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(d);
  const dayNum = new Intl.DateTimeFormat("pt-BR", { day: "numeric" }).format(d);
  const monthShort = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d);
  return { dayName, dayNum, monthShort };
}

function generateTimeSlots(opening: string, closing: string, durationMin: number): string[] {
  const slots: string[] = [];
  const [openH, openM] = opening.split(":").map(Number);
  const [closeH, closeM] = closing.split(":").map(Number);
  let current = openH * 60 + openM;
  const end = closeH * 60 + closeM;

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += durationMin;
  }
  return slots;
}

function getAppointmentTime(startsAt: string): string {
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function DayColumn({
  date,
  appointments,
  patientMap,
  professionalMap,
  openingTime = "08:00",
  closingTime = "18:00",
  slotDuration = 30,
  isToday = false,
  selectedProfessional = "",
}: Props) {
  const { dayName, dayNum, monthShort } = formatDayHeader(date);
  const timeSlots = generateTimeSlots(openingTime, closingTime, slotDuration);

  // Index appointments by time slot
  const apptBySlot = new Map<string, AppointmentData[]>();
  for (const appt of appointments) {
    const time = getAppointmentTime(appt.starts_at);
    if (!apptBySlot.has(time)) apptBySlot.set(time, []);
    apptBySlot.get(time)!.push(appt);
  }

  return (
    <div
      className={[
        "min-w-[160px] flex-1 border-r last:border-r-0",
        isToday ? "bg-blue-50/30" : "",
      ].join(" ")}
    >
      {/* Day header */}
      <div
        className={[
          "sticky top-0 z-10 border-b px-2 py-2 text-center",
          isToday ? "bg-blue-50 border-blue-200" : "bg-slate-50",
        ].join(" ")}
      >
        <p
          className={[
            "text-xs font-medium capitalize",
            isToday ? "text-blue-600" : "text-slate-500",
          ].join(" ")}
        >
          {dayName}
        </p>
        <p
          className={[
            "text-lg font-bold",
            isToday ? "text-blue-700" : "text-slate-900",
          ].join(" ")}
        >
          {dayNum}
        </p>
        <p className="text-[10px] text-slate-400 capitalize">{monthShort}</p>
      </div>

      {/* Time slots */}
      <div className="divide-y divide-slate-100">
        {timeSlots.map((time) => {
          const slotAppts = apptBySlot.get(time) ?? [];
          const hasAppts = slotAppts.length > 0;

          return (
            <div key={time} className="relative min-h-[64px] p-1">
              {/* Time label */}
              <span className="absolute left-1 top-1 text-[10px] font-medium text-slate-400">
                {time}
              </span>

              {/* Appointments */}
              {hasAppts ? (
                <div className="mt-3.5 space-y-1">
                  {slotAppts.map((appt) => {
                    const prof = appt.professional_id
                      ? professionalMap.get(appt.professional_id)
                      : null;
                    return (
                      <AppointmentCard
                        key={appt.id}
                        id={appt.id}
                        startsAt={appt.starts_at}
                        endsAt={appt.ends_at}
                        status={appt.status}
                        patientName={
                          patientMap.get(appt.patient_id) ?? "Paciente"
                        }
                        professionalName={prof?.name}
                        professionalColor={prof?.color}
                        notes={appt.notes}
                        compact
                      />
                    );
                  })}
                </div>
              ) : (
                /* Empty slot - click to create */
                <Link
                  href={`/dashboard/appointments/new?date=${date}&time=${time}${
                    selectedProfessional
                      ? `&professional_id=${selectedProfessional}`
                      : ""
                  }`}
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition hover:bg-blue-50/50 hover:opacity-100"
                  title={`Agendar às ${time}`}
                >
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                    + Agendar
                  </span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
