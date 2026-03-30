import Link from "next/link";
import { requireUser } from "@/services/auth.service";
import { getUserContext } from "@/services/clinic-memberships.service";
import {
  listAppointmentsByDateAndProfessional,
  listAppointmentsByWeek,
  groupAppointmentsByDate,
  getWeekDates,
  getMonday,
} from "@/services/appointments.service";
import { listProfessionals } from "@/services/professionals.service";
import type { ProfessionalRow } from "@/services/professionals.service";
import { listPatients } from "@/services/patients.service";
import type { Database } from "@/types/database";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
import AppointmentCard from "@/components/appointments/AppointmentCard";
import DayFilterBar from "@/components/appointments/DayFilterBar";
import WeekView from "@/components/appointments/WeekView";
import WeekNavigator from "@/components/appointments/WeekNavigator";
import ViewToggle from "@/components/appointments/ViewToggle";

export const dynamic = "force-dynamic";

function formatDateLabel(date: string): string {
  const d = new Date(date + "T12:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams?: {
    view?: string;
    date?: string;
    week?: string;
    professional?: string;
    error?: string;
  };
}) {
  const user = await requireUser();
  const ctx = await getUserContext(user.id);

  const today = new Date().toISOString().slice(0, 10);
  const isWeekView = searchParams?.view === "week";
  const selectedDate = searchParams?.date ?? today;
  const weekStart = searchParams?.week ?? getMonday(selectedDate);
  const selectedProfessional = searchParams?.professional ?? "";

  const error = searchParams?.error
    ? decodeURIComponent(searchParams.error)
    : null;

  let dayAppointments: AppointmentRow[] = [];
  let weekAppointments: AppointmentRow[] = [];
  let professionals: ProfessionalRow[] = [];
  let patientMap = new Map<string, string>();
  let professionalMap = new Map<string, { name: string; color: string }>();

  if (ctx.clinicId) {
    try {
      const [profs, patients] = await Promise.all([
        listProfessionals(ctx.clinicId, { activeOnly: true }),
        listPatients(ctx.clinicId),
      ]);

      professionals = profs;
      patientMap = new Map(patients.map((p) => [p.id, p.full_name]));
      professionalMap = new Map(
        profs.map((p) => [p.id, { name: p.full_name, color: p.color }])
      );

      if (isWeekView) {
        weekAppointments = await listAppointmentsByWeek(
          ctx.clinicId,
          weekStart,
          selectedProfessional || undefined
        );
      } else {
        dayAppointments = await listAppointmentsByDateAndProfessional(
          ctx.clinicId,
          selectedDate,
          selectedProfessional || undefined
        );
      }
    } catch {
      dayAppointments = [];
      weekAppointments = [];
    }
  }

  const weekDates = getWeekDates(weekStart);
  const appointmentsByDate = groupAppointmentsByDate(weekAppointments);

  // Day view stats
  const scheduled = dayAppointments.filter((a) => a.status === "SCHEDULED");
  const confirmed = dayAppointments.filter((a) => a.status === "CONFIRMED");
  const inProgress = dayAppointments.filter((a) => a.status === "IN_PROGRESS");
  const completed = dayAppointments.filter((a) => a.status === "COMPLETED");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <ViewToggle
            currentView={isWeekView ? "week" : "day"}
            selectedDate={selectedDate}
            weekStart={weekStart}
            selectedProfessional={selectedProfessional}
          />
        </div>
        <Link
          href={`/dashboard/appointments/new?date=${selectedDate}${
            selectedProfessional
              ? `&professional_id=${selectedProfessional}`
              : ""
          }`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Novo agendamento
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ═══ WEEK VIEW ═══ */}
      {isWeekView && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <WeekNavigator
              weekStart={weekStart}
              selectedProfessional={selectedProfessional}
            />

            {/* Professional filter for week */}
            <div className="flex items-center gap-2">
              <select
                defaultValue={selectedProfessional}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Todos profissionais</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <WeekView
            weekDates={weekDates}
            appointmentsByDate={appointmentsByDate}
            patientMap={patientMap}
            professionalMap={professionalMap}
            selectedProfessional={selectedProfessional}
          />
        </>
      )}

      {/* ═══ DAY VIEW ═══ */}
      {!isWeekView && (
        <>
          {/* Date subtitle */}
          <p className="text-sm text-slate-500 capitalize">
            {formatDateLabel(selectedDate)}
          </p>

          {/* Filter bar */}
          <DayFilterBar
            selectedDate={selectedDate}
            selectedProfessional={selectedProfessional}
            professionals={professionals}
          />

          {/* Stats summary */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Agendados", count: scheduled.length, color: "#3B82F6" },
              { label: "Confirmados", count: confirmed.length, color: "#6366F1" },
              { label: "Em atend.", count: inProgress.length, color: "#EAB308" },
              { label: "Concluídos", count: completed.length, color: "#22C55E" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs text-slate-600">
                  {s.label}: <span className="font-bold">{s.count}</span>
                </span>
              </div>
            ))}
            <div className="flex items-center rounded-lg border bg-white px-3 py-2">
              <span className="text-xs font-bold text-slate-900">
                Total: {dayAppointments.length}
              </span>
            </div>
          </div>

          {/* Appointment cards */}
          <div className="space-y-3">
            {dayAppointments.map((a) => {
              const prof = a.professional_id
                ? professionalMap.get(a.professional_id)
                : null;
              return (
                <AppointmentCard
                  key={a.id}
                  id={a.id}
                  startsAt={a.starts_at}
                  endsAt={a.ends_at}
                  status={a.status}
                  patientName={patientMap.get(a.patient_id) ?? "Paciente"}
                  professionalName={prof?.name}
                  professionalColor={prof?.color}
                  notes={a.notes}
                />
              );
            })}
          </div>

          {dayAppointments.length === 0 && (
            <div className="rounded-xl border bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 text-4xl">📅</div>
              <p className="text-slate-600">
                Nenhum agendamento para este dia.
              </p>
              <Link
                href={`/dashboard/appointments/new?date=${selectedDate}`}
                className="mt-3 inline-flex text-sm font-medium text-blue-600 hover:underline"
              >
                + Criar agendamento
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
