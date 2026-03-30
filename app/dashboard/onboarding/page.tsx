import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { getOnboardingStatus } from "@/services/onboarding.service";
import StepIndicator from "@/components/onboarding/StepIndicator";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  if (!ctx.clinicId) {
    redirect("/dashboard");
  }

  const status = await getOnboardingStatus(ctx.clinicId);

  if (status.isComplete) {
    redirect("/dashboard?success=Configuracao%20completa");
  }

  // Find first incomplete step
  const currentIndex = status.steps.findIndex((s) => !s.completed);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 text-4xl">🚀</div>
        <h1 className="text-2xl font-bold text-slate-900">
          Configure sua clínica
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Complete estes {status.totalSteps} passos para começar a usar o CRM Clínicas.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center">
        <StepIndicator steps={status.steps} currentIndex={currentIndex} />
      </div>

      {/* Progress */}
      <div className="text-center">
        <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${status.percentComplete}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {status.completedCount} de {status.totalSteps} completos
        </p>
      </div>

      {/* Steps list */}
      <div className="space-y-3">
        {status.steps.map((step, index) => {
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step.key}
              className={[
                "rounded-xl border p-5 transition",
                step.completed
                  ? "border-green-200 bg-green-50/50"
                  : isCurrent
                  ? "border-blue-300 bg-blue-50/50 shadow-sm"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      step.completed
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-500",
                    ].join(" ")}
                  >
                    {step.completed ? "✓" : index + 1}
                  </div>

                  <div>
                    <h3
                      className={[
                        "text-sm font-semibold",
                        step.completed
                          ? "text-green-800"
                          : "text-slate-900",
                      ].join(" ")}
                    >
                      {step.label}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </div>

                <Link
                  href={step.href}
                  className={[
                    "flex-shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition",
                    step.completed
                      ? "border border-green-300 bg-white text-green-700 hover:bg-green-50"
                      : isCurrent
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {step.completed ? "Editar" : isCurrent ? "Configurar →" : "Configurar"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skip */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-600 hover:underline"
        >
          Configurar depois →
        </Link>
      </div>
    </div>
  );
}
