"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

type Props = {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
};

const STYLES: Record<ToastType, string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export default function Toast({
  message,
  type = "success",
  duration = 4000,
  onClose,
}: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={[
        "fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300",
        STYLES[type],
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      ].join(" ")}
      role="alert"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/50 text-xs font-bold">
        {ICONS[type]}
      </span>
      <p className="text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="ml-2 text-xs opacity-60 transition hover:opacity-100"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}
