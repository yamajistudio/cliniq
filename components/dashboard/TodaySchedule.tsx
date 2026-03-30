import Link from "next/link";
import StatusDropdown from "@/components/appointments/StatusDropdown";
import {
  APPOINTMENT_STATUS_COLOR,
  type AppointmentStatus,
} from "@/lib/status";
import type { TodayAppointment } from "@/services/dashboard.service";

type Props = {
  appointments: TodayAppointment[];
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(d);
}

export default function TodaySchedule({ appointments }: Props) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border bg-white px-6 py-10 text-center">
        <div className="mb-3 text-3xl">📅</div>
        <p className="text-sm text-slate-500">
          Nenhum agendamento para hoje.
        </p>
        <Link
          href="/dashboard/appointments/new"
          className="mt-2 inline-flex text-sm font-medium text-blue-600 hover:underline"
        >
          + Criar agendamento
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Consultas de hoje ({appointments.length})
        </h2>
        <Link
          href="/dashboard/appointments"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Ver agenda →
        </Link>
      </div>

      <div className="divide-y">
        {appointments.map((appt) => {
          const status = appt.status as AppointmentStatus;
          const statusColor =
            APPOINTMENT_STATUS_COLOR[status] ?? "#94A3B8";
          const isCancelled = status === "CANCELLED" || status === "NO_SHOW";

          return (
            <div
              key={appt.id}
              className={[
                "flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50",
                isCancelled ? "opacity-50" : "",
              ].join(" ")}
            >
              {/* Time block */}
              <div className="flex h-11 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  {fmtTime(appt.starts_at)}
                </span>
                {appt.ends_at && (
                  <span className="text-[10px] text-slate-400">
                    {fmtTime(appt.ends_at)}
                  </span>
                )}
              </div>

              {/* Professional color bar */}
              <div
                className="h-10 w-1 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    appt.professional_color ?? statusColor,
                }}
              />

              {/* Info */}
              <Link
                href={`/dashboard/appointments/${appt.id}`}
                className="min-w-0 flex-1"
              >
                <p
                  className={[
                    "truncate text-sm font-medium",
                    isCancelled
                      ? "text-slate-400 line-through"
                      : "text-slate-900",
                  ].join(" ")}
                >
                  {appt.patient_name}
                </p>
                {appt.professional_name && (
                  <p className="truncate text-xs text-slate-500">
                    {appt.professional_name}
                  </p>
                )}
              </Link>

              {/* Status */}
              <div className="flex-shrink-0">
                <StatusDropdown
                  appointmentId={appt.id}
                  currentStatus={status}
                  size="sm"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
