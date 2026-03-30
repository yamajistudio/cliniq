"use client";

import { useState, useTransition } from "react";
import { updateWhatsAppSettingsAction } from "@/app/actions/settings.actions";

export type WhatsAppSettingsData = {
  whatsapp_phone_number_id: string | null;
  whatsapp_enabled: boolean;
};

type Props = { settings: WhatsAppSettingsData };

export default function WhatsAppSettings({ settings }: Props) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled]        = useState(settings.whatsapp_enabled);
  const [phoneId, setPhoneId]        = useState(settings.whatsapp_phone_number_id ?? "");
  const [saved, setSaved]            = useState(false);
  const [error, setError]            = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("whatsapp_enabled", enabled ? "true" : "false");

    startTransition(async () => {
      try {
        await updateWhatsAppSettingsAction(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar configurações");
      }
    });
  }

  return (
    <div className="rounded-xl border bg-white">
      <div className="border-b bg-slate-50 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Integração WhatsApp Business
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Configure o recebimento e envio de mensagens via Meta WhatsApp Business API.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Ativar WhatsApp</p>
            <p className="text-xs text-slate-500">
              Recebe e envia mensagens automáticas via IA neste canal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={[
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              enabled ? "bg-blue-600" : "bg-slate-200",
            ].join(" ")}
            aria-checked={enabled}
            role="switch"
          >
            <span
              className={[
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                enabled ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        {/* Phone Number ID */}
        <div>
          <label
            htmlFor="whatsapp_phone_number_id"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Phone Number ID
          </label>
          <input
            id="whatsapp_phone_number_id"
            name="whatsapp_phone_number_id"
            type="text"
            value={phoneId}
            onChange={(e) => setPhoneId(e.target.value)}
            placeholder="Ex: 123456789012345"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="mt-1 text-xs text-slate-400">
            Encontre em Meta Business Suite → WhatsApp → Números de telefone.
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700">
          <p className="font-semibold">Variáveis de ambiente necessárias no servidor:</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li><code>WHATSAPP_ACCESS_TOKEN</code> — token de acesso do App Meta</li>
            <li><code>WHATSAPP_APP_SECRET</code> — segredo para verificação de assinatura HMAC</li>
            <li><code>WHATSAPP_WEBHOOK_VERIFY_TOKEN</code> — token de verificação do webhook</li>
            <li><code>ANTHROPIC_API_KEY</code> — chave da API Anthropic para o motor de IA</li>
          </ul>
          <p className="mt-2">
            URL do webhook:{" "}
            <code className="rounded bg-blue-100 px-1">
              {typeof window !== "undefined" ? window.location.origin : "https://seu-projeto.supabase.co"}
              /functions/v1/whatsapp-webhook
            </code>
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
            ✓ Configurações salvas com sucesso
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}
