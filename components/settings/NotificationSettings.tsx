"use client";

import { useState } from "react";
import { updateNotificationSettingsAction } from "@/app/actions/settings.actions";
import type { NotificationSettingsRow } from "@/services/notification-settings.service";

type Props = { settings: NotificationSettingsRow };

const CHANNELS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
];

function ToggleCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={["rounded-xl border p-5 transition", enabled ? "bg-white" : "bg-slate-50 opacity-70"].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={["relative h-6 w-11 rounded-full transition-colors", enabled ? "bg-blue-600" : "bg-slate-300"].join(" ")}
        >
          <span className={["absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", enabled ? "translate-x-5" : "translate-x-0"].join(" ")} />
        </button>
      </div>
      {enabled && children && <div className="mt-4 pl-9 space-y-3">{children}</div>}
    </div>
  );
}

export default function NotificationSettings({ settings }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmEnabled, setConfirmEnabled] = useState(settings.confirm_enabled);
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminder_enabled);
  const [followupEnabled, setFollowupEnabled] = useState(settings.followup_enabled);
  const [birthdayEnabled, setBirthdayEnabled] = useState(settings.birthday_enabled);

  return (
    <form
      action={updateNotificationSettingsAction}
      onSubmit={() => setSubmitting(true)}
      className="rounded-xl border bg-white"
    >
      <div className="border-b bg-slate-50 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Notificações</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Configure lembretes e mensagens automáticas para seus pacientes.
        </p>
      </div>

      <div className="space-y-4 p-6">
        {/* Hidden fields for booleans */}
        <input type="hidden" name="confirm_enabled" value={confirmEnabled ? "true" : "false"} />
        <input type="hidden" name="reminder_enabled" value={reminderEnabled ? "true" : "false"} />
        <input type="hidden" name="followup_enabled" value={followupEnabled ? "true" : "false"} />
        <input type="hidden" name="birthday_enabled" value={birthdayEnabled ? "true" : "false"} />

        {/* Confirmação de consulta */}
        <ToggleCard
          icon="✅"
          title="Confirmação de consulta"
          description="Enviar mensagem pedindo confirmação antes da consulta."
          enabled={confirmEnabled}
          onToggle={() => setConfirmEnabled(!confirmEnabled)}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Horas antes</label>
              <select name="confirm_hours_before" defaultValue={settings.confirm_hours_before}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value={6}>6 horas</option>
                <option value={12}>12 horas</option>
                <option value={24}>24 horas</option>
                <option value={48}>48 horas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Canal</label>
              <select name="confirm_channel" defaultValue={settings.confirm_channel}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                {CHANNELS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
          </div>
        </ToggleCard>

        {/* Lembrete automático */}
        <ToggleCard
          icon="🔔"
          title="Lembrete automático"
          description="Enviar lembrete próximo ao horário da consulta."
          enabled={reminderEnabled}
          onToggle={() => setReminderEnabled(!reminderEnabled)}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Horas antes</label>
              <select name="reminder_hours_before" defaultValue={settings.reminder_hours_before}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value={1}>1 hora</option>
                <option value={2}>2 horas</option>
                <option value={4}>4 horas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Canal</label>
              <select name="reminder_channel" defaultValue={settings.reminder_channel}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                {CHANNELS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
          </div>
        </ToggleCard>

        {/* Follow-up pós consulta */}
        <ToggleCard
          icon="📋"
          title="Follow-up pós consulta"
          description="Enviar mensagem de acompanhamento após a consulta."
          enabled={followupEnabled}
          onToggle={() => setFollowupEnabled(!followupEnabled)}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Dias depois</label>
              <select name="followup_days_after" defaultValue={settings.followup_days_after}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value={1}>1 dia</option>
                <option value={3}>3 dias</option>
                <option value={7}>7 dias</option>
                <option value={14}>14 dias</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Canal</label>
              <select name="followup_channel" defaultValue={settings.followup_channel}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                {CHANNELS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
          </div>
        </ToggleCard>

        {/* Aniversário */}
        <ToggleCard
          icon="🎂"
          title="Aniversário do paciente"
          description="Enviar mensagem de felicitações no aniversário."
          enabled={birthdayEnabled}
          onToggle={() => setBirthdayEnabled(!birthdayEnabled)}
        />
      </div>

      <div className="border-t px-6 py-4">
        <button type="submit" disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
          {submitting ? "Salvando..." : "Salvar notificações"}
        </button>
      </div>
    </form>
  );
}
