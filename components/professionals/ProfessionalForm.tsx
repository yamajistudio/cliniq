"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProfessionalRow } from "@/services/professionals.service";

type Props = {
  action: (formData: FormData) => void;
  professional?: ProfessionalRow | null;
  backHref: string;
  submitLabel: string;
  error?: string | null;
};

const PRESET_COLORS = [
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#14B8A6", "#06B6D4", "#64748B", "#1E293B",
];

const SPECIALTIES = [
  "Clínico Geral",
  "Dentista",
  "Dermatologista",
  "Endocrinologista",
  "Fisioterapeuta",
  "Ginecologista",
  "Nutricionista",
  "Oftalmologista",
  "Ortopedista",
  "Pediatra",
  "Psicólogo",
  "Psiquiatra",
  "Outro",
];

export default function ProfessionalForm({
  action,
  professional,
  backHref,
  submitLabel,
  error,
}: Props) {
  const [color, setColor] = useState(professional?.color ?? "#3B82F6");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={action}
      onSubmit={() => setSubmitting(true)}
      className="max-w-2xl space-y-5 rounded-xl border bg-white p-6"
    >
      {professional?.id && (
        <input type="hidden" name="professional_id" value={professional.id} />
      )}
      <input type="hidden" name="color" value={color} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Nome */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          minLength={2}
          maxLength={200}
          defaultValue={professional?.full_name ?? ""}
          placeholder="Dr. João Silva"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Especialidade + Registro */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-slate-700">
            Especialidade <span className="text-red-500">*</span>
          </label>
          <select
            id="specialty"
            name="specialty"
            required
            defaultValue={professional?.specialty ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Selecione...</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="license_number" className="block text-sm font-medium text-slate-700">
            Registro profissional (CRM/CRO)
          </label>
          <input
            id="license_number"
            name="license_number"
            type="text"
            defaultValue={professional?.license_number ?? ""}
            placeholder="CRM 12345/SP"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Telefone + Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={professional?.phone ?? ""}
            placeholder="(00) 00000-0000"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={professional?.email ?? ""}
            placeholder="dr.joao@clinica.com"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Cor na agenda */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Cor na agenda
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Usada para identificar o profissional nos cards de agendamento.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={[
                "h-8 w-8 rounded-full border-2 transition",
                color === c ? "border-slate-900 scale-110 shadow-md" : "border-transparent hover:scale-105",
              ].join(" ")}
              style={{ backgroundColor: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border-0 p-0"
              title="Cor personalizada"
            />
            <span className="font-mono text-xs text-slate-500">{color}</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border bg-slate-50 p-4">
        <p className="text-xs font-medium text-slate-500 mb-2">Preview na agenda:</p>
        <div
          className="rounded-lg border bg-white p-3 shadow-sm"
          style={{ borderLeftWidth: "4px", borderLeftColor: color }}
        >
          <p className="text-sm font-medium text-slate-900">
            {professional?.full_name || "Dr. Nome do Profissional"}
          </p>
          <p className="text-xs text-slate-500">
            {professional?.specialty || "Especialidade"} · 09:00 - 09:30
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Salvando..." : submitLabel}
        </button>
        <Link
          href={backHref}
          className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
