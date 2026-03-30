import Link from "next/link";
import StatusDropdown from "./StatusDropdown";
import { APPOINTMENT_STATUS_COLOR } from "@/lib/status";
import type { AppointmentStatus } from "@/types/database";

type Props = {
  id: string;
  startsAt: string;
  endsAt?: string | null;
  status: AppointmentStatus;
  patientName: string;
  professionalName?: string | null;
  professionalColor?: string | null;
  notes?: string | null;
  compact?: boolean;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(d);
}

export default function AppointmentCard({
  id,
  startsAt,
  endsAt,
  status,
  patientName,
  professionalName,
  professionalColor,
  notes,
  compact = false,
}: Props) {
  const statusColor = APPOINTMENT_STATUS_COLOR[status] ?? "#94A3B8";
  const borderColor = professionalColor ?? statusColor;
  const time = formatTime(startsAt);
  const endTime = endsAt ? formatTime(endsAt) : null;
  const isCancelled = status === "CANCELLED";
  const isCompleted = status === "COMPLETED";

  return (
    <div
      className={[
        "group relative rounded-lg border bg-white shadow-sm transition hover:shadow-md",
        isCancelled ? "opacity-50" : "",
      ].join(" ")}
      style={{ borderLeftWidth: "4px", borderLeftColor: borderColor }}
    >
      <div className="flex items-start justify-between gap-2 p-3">
        <Link
          href={`/dashboard/appointments/${id}`}
          className="min-w-0 flex-1"
        >
          {/* Time */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {time}
            </span>
            {endTime && (
              <span className="text-xs text-slate-400">— {endTime}</span>
            )}
          </div>

          {/* Patient */}
          <p
            className={[
              "mt-1 truncate text-sm font-medium",
              isCancelled
                ? "text-slate-400 line-through"
                : "text-slate-700",
            ].join(" ")}
          >
            {patientName}
          </p>

          {/* Professional */}
          {professionalName && !compact && (
            <div className="mt-1 flex items-center gap-1.5">
              {professionalColor && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: professionalColor }}
                />
              )}
              <span className="truncate text-xs text-slate-500">
                {professionalName}
              </span>
            </div>
          )}

          {/* Notes preview */}
          {notes && !compact && (
            <p className="mt-1 truncate text-xs text-slate-400">
              {notes}
            </p>
          )}
        </Link>

        {/* Status dropdown */}
        <div className="flex-shrink-0">
          <StatusDropdown
            appointmentId={id}
            currentStatus={status}
            size="sm"
          />
        </div>
      </div>

      {/* Status indicator bar at bottom */}
      {!compact && (
        <div
          className="h-1 rounded-b-lg"
          style={{ backgroundColor: `${statusColor}30` }}
        />
      )}
    </div>
  );
}
