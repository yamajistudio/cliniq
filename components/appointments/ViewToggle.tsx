"use client";

import { useRouter } from "next/navigation";

type Props = {
  currentView: "day" | "week";
  selectedDate: string;
  weekStart: string;
  selectedProfessional: string;
};

export default function ViewToggle({
  currentView,
  selectedDate,
  weekStart,
  selectedProfessional,
}: Props) {
  const router = useRouter();

  function switchView(view: "day" | "week") {
    if (view === currentView) return;

    const params = new URLSearchParams();
    if (view === "week") {
      params.set("view", "week");
      params.set("week", weekStart);
    } else {
      params.set("date", selectedDate);
    }
    if (selectedProfessional) params.set("professional", selectedProfessional);
    router.push(`/dashboard/appointments?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
      <button
        type="button"
        onClick={() => switchView("day")}
        className={[
          "rounded-md px-3 py-1.5 text-xs font-medium transition",
          currentView === "day"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900",
        ].join(" ")}
      >
        Dia
      </button>
      <button
        type="button"
        onClick={() => switchView("week")}
        className={[
          "rounded-md px-3 py-1.5 text-xs font-medium transition",
          currentView === "week"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900",
        ].join(" ")}
      >
        Semana
      </button>
    </div>
  );
}
