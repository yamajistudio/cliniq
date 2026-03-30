import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-4xl">
          🔍
        </div>
        <h1 className="text-3xl font-bold text-slate-900">
          Página não encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ir para o Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
