"use client";

import { useState } from "react";
import { updateClinicAction } from "@/app/actions/settings.actions";

type ClinicData = {
  name: string | null;
  legal_name: string | null;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_path: string | null;
};

type Props = { clinic: ClinicData | null };

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function ClinicForm({ clinic }: Props) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={updateClinicAction}
      onSubmit={() => setSubmitting(true)}
      className="rounded-xl border bg-white"
    >
      <div className="border-b bg-slate-50 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Dados da clínica</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Informações que identificam sua clínica ou consultório.
        </p>
      </div>

      <div className="space-y-4 p-6">
        {/* Logo placeholder */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-2xl font-bold text-blue-600">
            {(clinic?.name ?? "C").charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Logo da clínica</p>
            <p className="text-xs text-slate-500">Upload de logo será habilitado em breve.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Nome da clínica <span className="text-red-500">*</span>
            </label>
            <input id="name" name="name" type="text" required defaultValue={clinic?.name ?? ""}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label htmlFor="legal_name" className="block text-sm font-medium text-slate-700">Razão social</label>
            <input id="legal_name" name="legal_name" type="text" defaultValue={clinic?.legal_name ?? ""}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tax_id" className="block text-sm font-medium text-slate-700">CNPJ</label>
            <input id="tax_id" name="tax_id" type="text" defaultValue={clinic?.tax_id ?? ""} placeholder="00.000.000/0001-00"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label htmlFor="clinic_phone" className="block text-sm font-medium text-slate-700">Telefone</label>
            <input id="clinic_phone" name="phone" type="tel" defaultValue={clinic?.phone ?? ""}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>

        <div>
          <label htmlFor="clinic_email" className="block text-sm font-medium text-slate-700">Email</label>
          <input id="clinic_email" name="email" type="email" defaultValue={clinic?.email ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700">Endereço</label>
          <input id="address" name="address" type="text" defaultValue={clinic?.address ?? ""} placeholder="Rua, número, bairro"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-slate-700">Cidade</label>
            <input id="city" name="city" type="text" defaultValue={clinic?.city ?? ""}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-slate-700">Estado</label>
            <select id="state" name="state" defaultValue={clinic?.state ?? ""}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="">Selecione...</option>
              {STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>
      </div>

      <div className="border-t px-6 py-4">
        <button type="submit" disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
          {submitting ? "Salvando..." : "Salvar dados"}
        </button>
      </div>
    </form>
  );
}
