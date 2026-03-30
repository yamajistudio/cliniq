"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">
          ⚠️
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Erro ao carregar
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Algo deu errado ao carregar esta página. Tente novamente.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-left">
            <p className="break-all font-mono text-xs text-red-700">
              {error.message}
            </p>
          </div>
        )}
        <div className="mt-5 flex items-center justify-center gap-3">
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
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}
