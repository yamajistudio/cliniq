"use client";

import { useState } from "react";
import { switchClinicAction } from "@/app/actions/clinic.actions";

type ClinicOption = {
  clinic_id: string;
  clinic_name: string;
  role: string;
};

type Props = {
  clinics: ClinicOption[];
  activeClinicId: string | null;
};

const ROLE_SHORT: Record<string, string> = {
  CLINIC_ADMIN: "Admin",
  MANAGER: "Gestor",
  DOCTOR: "Médico",
  RECEPTIONIST: "Recepção",
};

export default function ClinicSwitcher({ clinics, activeClinicId }: Props) {
  const [open, setOpen] = useState(false);

  if (clinics.length === 0) return null;

  const active = clinics.find((c) => c.clinic_id === activeClinicId) ?? clinics[0];
  const showSwitcher = clinics.length > 1;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => showSwitcher && setOpen(!open)}
        className={[
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition",
          showSwitcher ? "hover:bg-white/10 cursor-pointer" : "cursor-default",
        ].join(" ")}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
          {active.clinic_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">
            {active.clinic_name}
          </p>
          <p className="truncate text-[10px] text-slate-400">
            {ROLE_SHORT[active.role] ?? active.role}
          </p>
        </div>
        {showSwitcher && (
          <svg
            className={["h-3 w-3 text-slate-400 transition", open ? "rotate-180" : ""].join(" ")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && showSwitcher && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
          />
          <div className="absolute left-0 right-0 bottom-full z-50 mb-1 rounded-lg border border-slate-600 bg-slate-800 py-1 shadow-xl">
            {clinics.map((c) => (
              <form key={c.clinic_id} action={switchClinicAction}>
                <input type="hidden" name="clinic_id" value={c.clinic_id} />
                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className={[
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-white/10",
                    c.clinic_id === activeClinicId ? "bg-white/5" : "",
                  ].join(" ")}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600/30 text-[10px] font-bold text-blue-300">
                    {c.clinic_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-white">{c.clinic_name}</p>
                    <p className="text-[10px] text-slate-400">
                      {ROLE_SHORT[c.role] ?? c.role}
                    </p>
                  </div>
                  {c.clinic_id === activeClinicId && (
                    <span className="text-[10px] text-green-400">✓</span>
                  )}
                </button>
              </form>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
