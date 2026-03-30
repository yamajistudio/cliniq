"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PatientRow } from "@/services/patients.service";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { LEAD_SOURCE_LABEL } from "@/lib/status";
import type { PatientStatus } from "@/types/database";

type Props = {
  patients: PatientRow[];
};

function formatDate(valor?: string | null) {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data);
}

function formatCpf(cpf: string | null) {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(phone: string | null) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

export default function PatientList({ patients }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PatientStatus>(
    "ALL"
  );

  const filtered = useMemo(() => {
    let result = patients;

    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          (p.cpf ?? "").includes(q) ||
          (p.email ?? "").toLowerCase().includes(q) ||
          (p.phone ?? "").includes(q)
      );
    }

    return result;
  }, [patients, search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nome, CPF, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | PatientStatus)
            }
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Todos ({patients.length})</option>
            <option value="ACTIVE">
              Ativos ({patients.filter((p) => p.status === "ACTIVE").length})
            </option>
            <option value="INACTIVE">
              Inativos (
              {patients.filter((p) => p.status === "INACTIVE").length})
            </option>
          </select>
        </div>
      </div>

      {/* Contagem */}
      <p className="text-xs text-slate-500">
        {filtered.length} paciente{filtered.length !== 1 ? "s" : ""}{" "}
        {search || statusFilter !== "ALL" ? "encontrado(s)" : "cadastrado(s)"}
      </p>

      {/* Tabela desktop */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">CPF</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Origem</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/dashboard/patients/${p.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                    >
                      {p.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                    {formatCpf(p.cpf)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {formatPhone(p.phone)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {p.email ?? "-"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {p.source
                      ? (LEAD_SOURCE_LABEL as Record<string, string>)[
                          p.source
                        ] ?? p.source
                      : "-"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={p.status} type="patient" />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {formatDate(p.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="divide-y md:hidden">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/patients/${p.id}`}
              className="block p-4 transition hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {p.full_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatPhone(p.phone)}
                    {p.email && ` · ${p.email}`}
                  </p>
                  {p.cpf && (
                    <p className="mt-0.5 font-mono text-xs text-slate-400">
                      CPF: {formatCpf(p.cpf)}
                    </p>
                  )}
                </div>
                <StatusBadge status={p.status} type="patient" />
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center">
            {search || statusFilter !== "ALL" ? (
              <div>
                <p className="text-slate-500">
                  Nenhum paciente encontrado para este filtro.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div>
                <p className="text-slate-500">
                  Nenhum paciente cadastrado ainda.
                </p>
                <Link
                  href="/dashboard/patients/new"
                  className="mt-2 inline-flex text-sm font-medium text-blue-600 hover:underline"
                >
                  + Cadastrar primeiro paciente
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
