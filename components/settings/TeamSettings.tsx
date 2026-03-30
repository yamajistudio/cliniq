"use client";

import { useState } from "react";
import { inviteStaffAction, revokeInviteAction } from "@/app/actions/settings.actions";

type Member = {
  user_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string | null;
};

type Props = {
  members: Member[];
  invites: Invite[];
};

const ROLE_LABEL: Record<string, string> = {
  CLINIC_ADMIN: "Administrador",
  MANAGER: "Gestor",
  DOCTOR: "Médico / Profissional",
  RECEPTIONIST: "Recepcionista",
};

const ROLE_COLOR: Record<string, string> = {
  CLINIC_ADMIN: "bg-purple-100 text-purple-700",
  MANAGER: "bg-blue-100 text-blue-700",
  DOCTOR: "bg-green-100 text-green-700",
  RECEPTIONIST: "bg-orange-100 text-orange-700",
};

const INVITE_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  ACCEPTED: { label: "Aceito", color: "bg-green-100 text-green-700" },
  EXPIRED: { label: "Expirado", color: "bg-gray-100 text-gray-500" },
  REVOKED: { label: "Revogado", color: "bg-red-100 text-red-500" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

export default function TeamSettings({ members, invites }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const pendingInvites = invites.filter((i) => i.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <form
        action={inviteStaffAction}
        onSubmit={() => setSubmitting(true)}
        className="rounded-xl border bg-white"
      >
        <div className="border-b bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Convidar membro</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Envie um convite por email. O membro receberá acesso após aceitar.
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="invite_email" className="block text-xs font-medium text-slate-600">
                Email *
              </label>
              <input
                id="invite_email"
                name="email"
                type="email"
                required
                placeholder="membro@email.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="invite_role" className="block text-xs font-medium text-slate-600">
                Perfil *
              </label>
              <select
                id="invite_role"
                name="role"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Selecione...</option>
                <option value="CLINIC_ADMIN">Administrador</option>
                <option value="MANAGER">Gestor</option>
                <option value="DOCTOR">Médico / Profissional</option>
                <option value="RECEPTIONIST">Recepcionista</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Enviando..." : "Convidar"}
            </button>
          </div>

          {/* Role descriptions */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { role: "Administrador", desc: "Acesso total. Configurações, equipe, financeiro." },
              { role: "Gestor", desc: "Relatórios, métricas, gestão operacional." },
              { role: "Médico", desc: "Agenda própria, pacientes, notas clínicas." },
              { role: "Recepcionista", desc: "Agenda, pacientes, leads. Sem configurações." },
            ].map((r) => (
              <div key={r.role} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-700">{r.role}</p>
                <p className="text-[11px] text-slate-500">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </form>

      {/* Current members */}
      <div className="rounded-xl border bg-white">
        <div className="border-b bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Equipe atual ({members.length})
          </h2>
        </div>
        <div className="divide-y">
          {members.map((m) => {
            const roleStr = String(m.role ?? "").toUpperCase();
            return (
              <div key={m.user_id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {(m.full_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{m.full_name ?? "Sem nome"}</p>
                    <p className="text-xs text-slate-500">{m.email ?? "-"}</p>
                  </div>
                </div>
                <span className={["rounded-full px-2.5 py-1 text-xs font-medium", ROLE_COLOR[roleStr] ?? "bg-slate-100 text-slate-600"].join(" ")}>
                  {ROLE_LABEL[roleStr] ?? m.role}
                </span>
              </div>
            );
          })}
          {members.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              Nenhum membro na equipe.
            </div>
          )}
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="rounded-xl border bg-white">
          <div className="border-b bg-slate-50 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Convites pendentes ({pendingInvites.length})
            </h2>
          </div>
          <div className="divide-y">
            {pendingInvites.map((inv) => {
              const roleStr = String(inv.role ?? "").toUpperCase();
              const statusInfo = INVITE_STATUS[inv.status] ?? { label: inv.status, color: "bg-slate-100 text-slate-600" };

              return (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.email}</p>
                    <p className="text-xs text-slate-500">
                      {ROLE_LABEL[roleStr] ?? inv.role} · Expira em {fmtDate(inv.expires_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={["rounded-full px-2 py-0.5 text-xs font-medium", statusInfo.color].join(" ")}>
                      {statusInfo.label}
                    </span>
                    <form action={revokeInviteAction}>
                      <input type="hidden" name="invite_id" value={inv.id} />
                      <button
                        type="submit"
                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        Revogar
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
