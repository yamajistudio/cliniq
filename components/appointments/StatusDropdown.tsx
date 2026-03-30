"use client";

import { useRef, useState } from "react";
import { changeAppointmentStatusAction } from "@/app/actions/appointments.actions";
import {
  APPOINTMENT_FLOW,
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_COLOR,
  type AppointmentStatus,
} from "@/lib/status";

type Props = {
  appointmentId: string;
  currentStatus: AppointmentStatus;
  size?: "sm" | "md";
};

export default function StatusDropdown({
  appointmentId,
  currentStatus,
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const transitions = APPOINTMENT_FLOW[currentStatus] ?? [];
  const color = APPOINTMENT_STATUS_COLOR[currentStatus] ?? "#94A3B8";
  const label = APPOINTMENT_STATUS_LABEL[currentStatus] ?? currentStatus;

  if (transitions.length === 0) {
    return (
      <span
        className={[
          "inline-flex items-center rounded-full border font-medium",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        ].join(" ")}
        style={{ borderColor: color, color, backgroundColor: `${color}15` }}
      >
        {label}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className={[
          "inline-flex items-center gap-1 rounded-full border font-medium transition hover:shadow-sm",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        ].join(" ")}
        style={{ borderColor: color, color, backgroundColor: `${color}15` }}
      >
        {label}
        <svg
          className={["h-3 w-3 transition", open ? "rotate-180" : ""].join(" ")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
          />
          <div className="absolute right-0 z-50 mt-1 min-w-[160px] rounded-lg border bg-white py-1 shadow-lg">
            {transitions.map((status) => {
              const nextColor = APPOINTMENT_STATUS_COLOR[status] ?? "#94A3B8";
              const nextLabel = APPOINTMENT_STATUS_LABEL[status] ?? status;

              return (
                <form
                  key={status}
                  action={changeAppointmentStatusAction}
                  onSubmit={() => {
                    setLoading(true);
                    setOpen(false);
                  }}
                >
                  <input type="hidden" name="appointment_id" value={appointmentId} />
                  <input type="hidden" name="status" value={status} />
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: nextColor }}
                    />
                    {nextLabel}
                  </button>
                </form>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
