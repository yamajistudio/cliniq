import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import { getClinicById, listClinicMembers } from "@/services/clinics.service";
import { getClinicSettings } from "@/services/clinic-settings.service";
import { getNotificationSettings } from "@/services/notification-settings.service";
import { listStaffInvites } from "@/services/staff-invites.service";
import ClinicForm from "@/components/settings/ClinicForm";
import ScheduleSettings from "@/components/settings/ScheduleSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import TeamSettings from "@/components/settings/TeamSettings";
import WhatsAppSettings from "@/components/settings/WhatsAppSettings";
import SettingsTabs from "@/components/settings/SettingsTabs";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { tab?: string; error?: string; success?: string };
}) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  const activeTab = searchParams?.tab ?? "clinic";
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const success = searchParams?.success ? decodeURIComponent(searchParams.success) : null;

  let clinic: any = null;
  let settings: any = null;
  let notifications: any = null;
  let members: any[] = [];
  let invites: any[] = [];

  if (ctx.clinicId) {
    try {
      [clinic, settings, notifications, members, invites] = await Promise.all([
        getClinicById(ctx.clinicId),
        getClinicSettings(ctx.clinicId),
        getNotificationSettings(ctx.clinicId),
        listClinicMembers(ctx.clinicId),
        listStaffInvites(ctx.clinicId),
      ]);
    } catch {
      // Silently fail individual fetches
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-600">
          Gerencie dados da clínica, horários, notificações e equipe.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ {success}
        </div>
      )}

      {/* Tabs */}
      <SettingsTabs activeTab={activeTab} />

      {/* Tab content */}
      <div className="max-w-3xl">
        {activeTab === "clinic" && (
          <div className="space-y-6">
            <ClinicForm clinic={clinic} />
            {/* Account info */}
            <div className="rounded-xl border bg-white">
              <div className="border-b bg-slate-50 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Sua conta</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                  <p className="mt-1 text-sm text-slate-900">{user.email ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Papel</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {ctx.role === "CLINIC_ADMIN" ? "Administrador" :
                     ctx.role === "MANAGER" ? "Gestor" :
                     ctx.role === "DOCTOR" ? "Médico" :
                     ctx.role === "RECEPTIONIST" ? "Recepcionista" :
                     ctx.role ?? "Sem vínculo"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Clínica ID</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {ctx.clinicId?.slice(0, 8) ?? "-"}...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "schedule" && settings && (
          <ScheduleSettings settings={settings} />
        )}

        {activeTab === "notifications" && notifications && (
          <NotificationSettings settings={notifications} />
        )}

        {activeTab === "team" && (
          <TeamSettings members={members} invites={invites} />
        )}

        {activeTab === "whatsapp" && settings && (
          <WhatsAppSettings
            settings={{
              whatsapp_phone_number_id: (settings as any).whatsapp_phone_number_id ?? null,
              whatsapp_enabled: (settings as any).whatsapp_enabled ?? false,
            }}
          />
        )}
      </div>
    </div>
  );
}
