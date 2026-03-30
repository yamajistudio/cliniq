import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { listClinicMembers } from "@/services/clinics.service";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  CLINIC_ADMIN: "Administrador",
  MANAGER: "Gestor",
  DOCTOR: "Médico",
  RECEPTIONIST: "Recepcionista",
};

const ROLE_COLOR: Record<string, string> = {
  CLINIC_ADMIN: "bg-purple-100 text-purple-700",
  MANAGER: "bg-blue-100 text-blue-700",
  DOCTOR: "bg-green-100 text-green-700",
  RECEPTIONIST: "bg-orange-100 text-orange-700",
};

export default async function StaffPage() {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  let members: any[] = [];
  if (ctx.clinicId) {
    try {
      members = await listClinicMembers(ctx.clinicId);
    } catch {
      members = [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipe</h1>
          <p className="text-sm text-slate-600">
            {members.length} membro{members.length !== 1 ? "s" : ""} vinculado
            {members.length !== 1 ? "s" : ""} à clínica
          </p>
        </div>
        <Link
          href="/dashboard/professionals"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          👨‍⚕️ Ver profissionais
        </Link>
      </div>

      {members.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="divide-y">
            {members.map((m) => {
              const roleStr = String(m.role ?? "").toUpperCase();
              return (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                      {(m.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {m.full_name ?? "Sem nome"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {m.email ?? "-"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      ROLE_COLOR[roleStr] ?? "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {ROLE_LABEL[roleStr] ?? m.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<span>👥</span>}
          title="Nenhum membro na equipe"
          description="Convide membros para sua clínica ou cadastre profissionais de saúde."
          actionLabel="+ Cadastrar profissional"
          actionHref="/dashboard/professionals/new"
        />
      )}
    </div>
  );
}
