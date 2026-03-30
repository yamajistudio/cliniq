import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  compact?: boolean;
};

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
  compact = false,
}: Props) {
  return (
    <div
      className={[
        "rounded-xl border bg-white text-center",
        compact ? "px-4 py-8" : "px-6 py-16",
      ].join(" ")}
    >
      {icon && (
        <div className={compact ? "mb-2 text-2xl" : "mx-auto mb-4 text-4xl"}>
          {icon}
        </div>
      )}

      <p
        className={[
          "font-medium text-slate-600",
          compact ? "text-sm" : "text-base",
        ].join(" ")}
      >
        {title}
      </p>

      {description && (
        <p
          className={[
            "mt-1 text-slate-500",
            compact ? "text-xs" : "text-sm",
          ].join(" ")}
        >
          {description}
        </p>
      )}

      {(actionLabel || secondaryLabel) && (
        <div
          className={[
            "flex items-center justify-center gap-3",
            compact ? "mt-3" : "mt-5",
          ].join(" ")}
        >
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {actionLabel}
            </Link>
          )}
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
