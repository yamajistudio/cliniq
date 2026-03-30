import Link from "next/link";
import type { OnboardingStatus } from "@/services/onboarding.service";

type Props = {
  status: OnboardingStatus;
};

export default function OnboardingBanner({ status }: Props) {
  if (status.isComplete || status.totalSteps === 0) return null;

  const nextIncomplete = status.steps.find((s) => !s.completed);

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚀</span>
            <h3 className="text-sm font-semibold text-slate-900">
              Configure sua clínica
            </h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              {status.completedCount}/{status.totalSteps}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Complete a configuração para começar a agendar consultas.
            {nextIncomplete && (
              <span className="ml-1 font-medium text-blue-700">
                Próximo: {nextIncomplete.label}
              </span>
            )}
          </p>

          {/* Progress bar */}
          <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${status.percentComplete}%` }}
            />
          </div>
        </div>

        <Link
          href="/dashboard/onboarding"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Configurar →
        </Link>
      </div>

      {/* Step indicators */}
      <div className="mt-4 flex flex-wrap gap-3">
        {status.steps.map((step) => (
          <div
            key={step.key}
            className={[
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              step.completed
                ? "bg-green-100 text-green-700"
                : "bg-white text-slate-500 border border-slate-200",
            ].join(" ")}
          >
            <span>{step.completed ? "✓" : "○"}</span>
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}
