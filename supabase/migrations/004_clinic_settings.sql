-- ============================================================================
-- CRM Clinicas — Migration 004: Clinic Settings
-- ============================================================================

create table if not exists clinic_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  opening_time time not null default '08:00',
  closing_time time not null default '18:00',
  slot_duration_minutes integer not null default 30 check (slot_duration_minutes > 0),
  days_open integer[] not null default '{1,2,3,4,5}',
  lunch_start time,
  lunch_end time,
  allow_online_booking boolean not null default false,
  timezone text not null default 'America/Sao_Paulo',
  appointment_buffer_minutes integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (clinic_id),
  constraint valid_hours check (opening_time < closing_time),
  constraint valid_lunch check (
    (lunch_start is null and lunch_end is null) or
    (lunch_start is not null and lunch_end is not null and lunch_start < lunch_end)
  )
);

create index if not exists idx_clinic_settings_clinic
  on clinic_settings(clinic_id);

create trigger trg_clinic_settings_updated_at
  before update on clinic_settings
  for each row execute function crm_set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table clinic_settings enable row level security;

create policy "clinic_settings_select" on clinic_settings
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "clinic_settings_insert" on clinic_settings
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "clinic_settings_update" on clinic_settings
  for update using (clinic_id in (select crm_user_clinic_ids()));
