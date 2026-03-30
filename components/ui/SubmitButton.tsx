"use client";

import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";

type Props = {
  label: string;
  loadingLabel?: string;
  variant?: "primary" | "danger" | "secondary";
  className?: string;
};

const VARIANTS = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:bg-slate-100",
};

export default function SubmitButton({
  label,
  loadingLabel,
  variant = "primary",
  className = "",
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition",
        VARIANTS[variant],
        className,
      ].join(" ")}
    >
      {pending && <Spinner size="sm" color="text-current" />}
      {pending ? (loadingLabel ?? "Salvando...") : label}
    </button>
  );
}
