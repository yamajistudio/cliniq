-- ============================================================================
-- CRM Clinicas — Migration 003: Appointment Status History + Confirmation
-- ============================================================================

-- ── Campos de confirmacao em appointments ────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'confirmed_at'
  ) then
    alter table appointments add column confirmed_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'confirmed_by'
  ) then
    alter table appointments add column confirmed_by uuid references auth.users(id) on delete set null;
  end if;
end $$;

-- ── appointment_status_history ───────────────────────────────────────────────

create table if not exists appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_appt_status_history_appointment
  on appointment_status_history(appointment_id);

create index if not exists idx_appt_status_history_clinic
  on appointment_status_history(clinic_id);

create index if not exists idx_appt_status_history_created
  on appointment_status_history(appointment_id, created_at);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table appointment_status_history enable row level security;

create policy "appt_status_history_select" on appointment_status_history
  for select using (clinic_id in (select crm_user_clinic_ids()));

create policy "appt_status_history_insert" on appointment_status_history
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
