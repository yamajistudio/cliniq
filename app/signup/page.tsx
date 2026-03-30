import Link from "next/link";
import { signUpAction } from "@/app/actions/auth.actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { error?: string; success?: string };
}) {
  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;
  const success = searchParams?.success
    ? decodeURIComponent(searchParams.success)
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form
        action={signUpAction}
        className="w-full max-w-md space-y-5 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Criar conta</h1>
            <p className="text-sm text-slate-600">
              Comece seu trial grátis de 14 dias
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            ✓ {success}
          </div>
        )}

        <div>
          <label htmlFor="clinic_name" className="block text-sm font-medium text-slate-700">
            Nome da clínica
          </label>
          <input
            id="clinic_name"
            name="clinic_name"
            type="text"
            placeholder="Clínica Vida & Saúde"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-xs text-slate-500">Pode alterar depois nas configurações.</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Senha <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-xs text-slate-500">Mínimo 6 caracteres.</p>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Criar conta e começar trial
        </button>

        <p className="text-center text-xs text-slate-500">
          14 dias grátis. Sem cartão de crédito.
        </p>

        <div className="border-t pt-4 text-center text-sm">
          <span className="text-slate-500">Já tem conta? </span>
          <Link className="font-medium text-blue-600 hover:underline" href="/login">
            Fazer login
          </Link>
        </div>
      </form>
    </div>
  );
}
