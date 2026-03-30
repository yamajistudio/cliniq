"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 text-4xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ocorreu um erro inesperado. Tente novamente ou volte para o início.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-left">
            <p className="text-xs font-mono text-red-700 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ir para Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
