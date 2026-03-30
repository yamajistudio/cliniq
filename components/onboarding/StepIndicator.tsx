import type { OnboardingStep } from "@/services/onboarding.service";

type Props = {
  steps: OnboardingStep[];
  currentIndex: number;
};

export default function StepIndicator({ steps, currentIndex }: Props) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = step.completed;
        const isCurrent = index === currentIndex;
        const isPast = index < currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-2">
            {/* Circle */}
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                isCompleted
                  ? "bg-green-500 text-white"
                  : isCurrent
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-slate-200 text-slate-500",
              ].join(" ")}
            >
              {isCompleted ? "✓" : index + 1}
            </div>

            {/* Label (hidden on small screens) */}
            <span
              className={[
                "hidden text-xs font-medium sm:block",
                isCurrent ? "text-blue-700" : isCompleted ? "text-green-700" : "text-slate-400",
              ].join(" ")}
            >
              {step.label}
            </span>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={[
                  "h-0.5 w-6 sm:w-10",
                  isCompleted || isPast ? "bg-green-300" : "bg-slate-200",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
