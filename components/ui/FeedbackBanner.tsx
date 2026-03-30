"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function FeedbackBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const errorParam = searchParams.get("error");
  const successParam = searchParams.get("success");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam) setError(decodeURIComponent(errorParam));
    if (successParam) setSuccess(decodeURIComponent(successParam));
  }, [errorParam, successParam]);

  function dismiss() {
    setError(null);
    setSuccess(null);
    // Clean URL params
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    params.delete("success");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(newUrl, { scroll: false });
  }

  // Auto-dismiss success after 5s
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [success]);

  if (!error && !success) return null;

  const isError = Boolean(error);
  const message = error || success;

  return (
    <div
      className={[
        "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700",
      ].join(" ")}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span>{isError ? "✕" : "✓"}</span>
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="text-xs opacity-60 transition hover:opacity-100"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}
