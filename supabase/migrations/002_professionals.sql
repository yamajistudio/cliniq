-- ============================================================================
-- CRM Clinicas — Migration 002: Professionals
-- ============================================================================

create extension if not exists pgcrypto;

-- ── professionals ────────────────────────────────────────────────────────────

create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  specialty text not null,
  license_number text,
  phone text,
  email text,
  color text not null default '#3B82F6',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_professionals_clinic
  on professionals(clinic_id);

create index if not exists idx_professionals_user
  on professionals(user_id)
  where user_id is not null;

create unique index if not exists idx_professionals_clinic_license
  on professionals(clinic_id, license_number)
  where license_number is not null;

create trigger trg_professionals_updated_at
  before update on professionals
  for each row execute function crm_set_updated_at();

-- ── professional_schedules ───────────────────────────────────────────────────

create table if not exists professional_schedules (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null default '08:00',
  end_time time not null default '18:00',
  slot_duration_minutes integer not null default 30 check (slot_duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, day_of_week),
  constraint valid_time_range check (start_time < end_time)
);

create index if not exists idx_professional_schedules_professional
  on professional_schedules(professional_id);

create index if not exists idx_professional_schedules_clinic
  on professional_schedules(clinic_id);

create trigger trg_professional_schedules_updated_at
  before update on professional_schedules
  for each row execute function crm_set_updated_at();

-- ── Adicionar professional_id em appointments ────────────────────────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'professional_id'
  ) then
    alter table appointments
      add column professional_id uuid references professionals(id) on delete set null;
    create index idx_appointments_professional on appointments(professional_id);
  end if;
end $$;

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table professionals enable row level security;
alter table professional_schedules enable row level security;

-- Professionals: acesso por clinica
create policy "professionals_select" on professionals
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "professionals_insert" on professionals
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "professionals_update" on professionals
  for update using (clinic_id in (select crm_user_clinic_ids()));
create policy "professionals_delete" on professionals
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- Professional Schedules: acesso por clinica
create policy "professional_schedules_select" on professional_schedules
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "professional_schedules_insert" on professional_schedules
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "professional_schedules_update" on professional_schedules
  for update using (clinic_id in (select crm_user_clinic_ids()));
create policy "professional_schedules_delete" on professional_schedules
  for delete using (clinic_id in (select crm_user_clinic_ids()));
