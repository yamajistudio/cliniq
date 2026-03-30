import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth.actions";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: { error?: string; success?: string };
}) {
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const success = searchParams?.success ? decodeURIComponent(searchParams.success) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form
        action={requestPasswordResetAction}
        className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-bold text-slate-900">Esqueci minha senha</h1>
        <p className="mt-1 text-sm text-slate-600">
          Informe seu email para receber o link de redefinição.
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-700">Email</label>
        <input
          className="mt-2 w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          name="email"
          type="email"
          required
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          Enviar link
        </button>

        <div className="mt-4 text-sm">
          <Link className="text-slate-600 hover:underline" href="/login">
            Voltar para login
          </Link>
        </div>
      </form>
    </div>
  );
}
