"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { PatientRow } from "@/services/patients.service";
import { LEAD_SOURCE, LEAD_SOURCE_LABEL } from "@/lib/status";

type Props = {
  action: (formData: FormData) => void;
  patient?: PatientRow | null;
  backHref: string;
  submitLabel: string;
  error?: string | null;
};

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function PatientForm({
  action,
  patient,
  backHref,
  submitLabel,
  error,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [cpf, setCpf] = useState(
    patient?.cpf ? formatCpf(patient.cpf) : ""
  );
  const [phone, setPhone] = useState(
    patient?.phone ? formatPhone(patient.phone) : ""
  );
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    setSubmitting(true);
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-5 rounded-xl border bg-white p-6"
    >
      {patient?.id && (
        <input type="hidden" name="patient_id" value={patient.id} />
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Nome */}
      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-slate-700"
        >
          Nome completo <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          minLength={2}
          maxLength={200}
          defaultValue={patient?.full_name ?? ""}
          placeholder="Nome completo do paciente"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* CPF + Nascimento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="cpf"
            className="block text-sm font-medium text-slate-700"
          >
            CPF
          </label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label
            htmlFor="birth_date"
            className="block text-sm font-medium text-slate-700"
          >
            Data de nascimento
          </label>
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            defaultValue={patient?.birth_date ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Telefone + Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700"
          >
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            maxLength={15}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={patient?.email ?? ""}
            placeholder="paciente@email.com"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Gênero + Origem */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-slate-700"
          >
            Gênero
          </label>
          <select
            id="gender"
            name="gender"
            defaultValue={patient?.gender ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Selecione...</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="NB">Não-binário</option>
            <option value="O">Outro</option>
            <option value="NI">Prefiro não informar</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="source"
            className="block text-sm font-medium text-slate-700"
          >
            Como conheceu a clínica
          </label>
          <select
            id="source"
            name="source"
            defaultValue={patient?.source ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Selecione...</option>
            {LEAD_SOURCE.map((s) => (
              <option key={s} value={s}>
                {LEAD_SOURCE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-slate-700"
        >
          Endereço
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={patient?.address ?? ""}
          placeholder="Rua, número, bairro, cidade"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Observações */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-slate-700"
        >
          Observações
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={patient?.notes ?? ""}
          placeholder="Alergias, condições médicas, preferências..."
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
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
