import type { ReactNode } from "react";
import NavLink from "./NavLink";

type Props = {
  footer?: ReactNode;
  className?: string;
};

export default function Sidebar({ footer, className }: Props) {
  return (
    <aside
      className={[
        "flex h-full min-h-0 w-full max-w-full flex-shrink-0 flex-col bg-[#0f172a] text-slate-300",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 border-b border-slate-700/50 p-4 sm:p-5 lg:p-6">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg shadow-lg">
          C
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold leading-tight tracking-wide text-white sm:text-lg">
            CRM Clínicas
          </h1>
          <p className="truncate text-xs font-medium text-slate-400">
            Gestão de pacientes e agenda
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 sm:py-6">
        <div className="flex min-h-0 flex-col gap-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Principal
          </p>

          <NavLink href="/dashboard" icon={<span>📊</span>} label="Dashboard" />
          <NavLink
            href="/dashboard/patients"
            icon={<span>👤</span>}
            label="Pacientes"
          />
          <NavLink
            href="/dashboard/leads"
            icon={<span>🎯</span>}
            label="Leads"
          />
          <NavLink
            href="/dashboard/appointments"
            icon={<span>📅</span>}
            label="Agendamentos"
          />
          <NavLink
            href="/dashboard/inbox"
            icon={<span>💬</span>}
            label="Inbox"
          />
          <NavLink
            href="/dashboard/professionals"
            icon={<span>👨‍⚕️</span>}
            label="Profissionais"
          />

          <div className="my-4 border-t border-slate-700/50" />

          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Gestão
          </p>

          <NavLink
            href="/dashboard/services"
            icon={<span>💉</span>}
            label="Serviços"
          />
          <NavLink
            href="/dashboard/financeiro"
            icon={<span>💰</span>}
            label="Financeiro"
          />
          <NavLink
            href="/dashboard/staff"
            icon={<span>👥</span>}
            label="Equipe"
          />
          <NavLink
            href="/dashboard/settings"
            icon={<span>⚙️</span>}
            label="Configurações"
          />
        </div>
      </nav>

      <div className="border-t border-slate-700/50 p-4">{footer}</div>
    </aside>
  );
}
