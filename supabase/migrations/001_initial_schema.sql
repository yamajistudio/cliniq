-- ============================================================================
-- CRM Clínicas — Migration Inicial
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Enums ────────────────────────────────────────────────────────────────────

do $$ begin
  create type clinic_role as enum ('CLINIC_ADMIN', 'MANAGER', 'DOCTOR', 'RECEPTIONIST');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type lead_status as enum ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type lead_source as enum ('WEBSITE', 'INSTAGRAM', 'WHATSAPP', 'INDICACAO', 'GOOGLE', 'OUTRO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type appointment_status as enum ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type patient_status as enum ('ACTIVE', 'INACTIVE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type membership_status as enum ('ACTIVE', 'INACTIVE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type follow_up_status as enum ('PENDING', 'DONE', 'CANCELLED');
exception when duplicate_object then null;
end $$;

-- ── Trigger helper ───────────────────────────────────────────────────────────

create or replace function crm_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Clinics (tenant raiz) ────────────────────────────────────────────────────

create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  phone text,
  email text,
  address text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_clinics_updated_at
  before update on clinics
  for each row execute function crm_set_updated_at();

-- ── Profiles ─────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ── Clinic Memberships ───────────────────────────────────────────────────────

create table if not exists clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role clinic_role not null default 'RECEPTIONIST',
  status membership_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create index idx_clinic_memberships_clinic on clinic_memberships(clinic_id);
create index idx_clinic_memberships_user on clinic_memberships(user_id);

create trigger trg_clinic_memberships_updated_at
  before update on clinic_memberships
  for each row execute function crm_set_updated_at();

-- ── Patients ─────────────────────────────────────────────────────────────────

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  cpf text,
  email text,
  phone text,
  birth_date date,
  gender text,
  address text,
  notes text,
  source lead_source,
  status patient_status not null default 'ACTIVE',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_patients_clinic on patients(clinic_id);
create unique index idx_patients_clinic_cpf on patients(clinic_id, cpf) where cpf is not null;

create trigger trg_patients_updated_at
  before update on patients
  for each row execute function crm_set_updated_at();

-- ── Leads ────────────────────────────────────────────────────────────────────

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  source lead_source not null default 'OUTRO',
  status lead_status not null default 'NEW',
  notes text,
  assigned_to uuid references auth.users(id) on delete set null,
  converted_patient_id uuid references patients(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leads_clinic on leads(clinic_id);
create index idx_leads_status on leads(clinic_id, status);

create trigger trg_leads_updated_at
  before update on leads
  for each row execute function crm_set_updated_at();

-- ── Services Catalog ─────────────────────────────────────────────────────────

create table if not exists services_catalog (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null default 30,
  price numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_catalog_clinic on services_catalog(clinic_id);

create trigger trg_services_catalog_updated_at
  before update on services_catalog
  for each row execute function crm_set_updated_at();

-- ── Appointments ─────────────────────────────────────────────────────────────

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid references auth.users(id) on delete set null,
  service_id uuid references services_catalog(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status appointment_status not null default 'SCHEDULED',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_appointments_clinic on appointments(clinic_id);
create index idx_appointments_doctor on appointments(doctor_id);
create index idx_appointments_patient on appointments(patient_id);
create index idx_appointments_starts_at on appointments(clinic_id, starts_at);

create trigger trg_appointments_updated_at
  before update on appointments
  for each row execute function crm_set_updated_at();

-- ── Medical Notes ────────────────────────────────────────────────────────────

create table if not exists medical_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete set null,
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_medical_notes_appointment on medical_notes(appointment_id);
create index idx_medical_notes_patient on medical_notes(patient_id);

-- ── Follow-ups ───────────────────────────────────────────────────────────────

create table if not exists follow_ups (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  scheduled_for date not null,
  status follow_up_status not null default 'PENDING',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_follow_ups_clinic on follow_ups(clinic_id);
create index idx_follow_ups_scheduled on follow_ups(clinic_id, scheduled_for);

-- ── Attachments (genérico) ───────────────────────────────────────────────────

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  storage_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_attachments_entity on attachments(entity_type, entity_id);

-- ── Audit Logs ───────────────────────────────────────────────────────────────

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}',
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index idx_audit_logs_actor on audit_logs(actor_user_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table clinics enable row level security;
alter table profiles enable row level security;
alter table clinic_memberships enable row level security;
alter table patients enable row level security;
alter table leads enable row level security;
alter table services_catalog enable row level security;
alter table appointments enable row level security;
alter table medical_notes enable row level security;
alter table follow_ups enable row level security;
alter table attachments enable row level security;
alter table audit_logs enable row level security;

-- Helper: retorna os clinic_ids do usuario autenticado
create or replace function crm_user_clinic_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select clinic_id
  from clinic_memberships
  where user_id = auth.uid()
    and status = 'ACTIVE';
$$;

-- Profiles: usuario ve e edita o proprio perfil
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- Clinics: usuario ve clinicas onde tem membership
create policy "clinics_select" on clinics
  for select using (id in (select crm_user_clinic_ids()));

-- Clinic Memberships
create policy "clinic_memberships_select" on clinic_memberships
  for select using (clinic_id in (select crm_user_clinic_ids()));

-- Patients: acesso por clinica
create policy "patients_select" on patients
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "patients_insert" on patients
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "patients_update" on patients
  for update using (clinic_id in (select crm_user_clinic_ids()));

-- Leads: acesso por clinica
create policy "leads_select" on leads
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "leads_insert" on leads
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "leads_update" on leads
  for update using (clinic_id in (select crm_user_clinic_ids()));

-- Services Catalog
create policy "services_catalog_select" on services_catalog
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "services_catalog_insert" on services_catalog
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "services_catalog_update" on services_catalog
  for update using (clinic_id in (select crm_user_clinic_ids()));

-- Appointments
create policy "appointments_select" on appointments
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "appointments_insert" on appointments
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "appointments_update" on appointments
  for update using (clinic_id in (select crm_user_clinic_ids()));

-- Medical Notes
create policy "medical_notes_select" on medical_notes
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "medical_notes_insert" on medical_notes
  for insert with check (clinic_id in (select crm_user_clinic_ids()));

-- Follow-ups
create policy "follow_ups_select" on follow_ups
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "follow_ups_insert" on follow_ups
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "follow_ups_update" on follow_ups
  for update using (clinic_id in (select crm_user_clinic_ids()));

-- Attachments
create policy "attachments_select" on attachments
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "attachments_insert" on attachments
  for insert with check (clinic_id in (select crm_user_clinic_ids()));

-- Audit Logs: apenas insert (append-only)
create policy "audit_logs_insert" on audit_logs
  for insert with check (actor_user_id = auth.uid());
create policy "audit_logs_select" on audit_logs
  for select using (
    exists (
      select 1 from clinic_memberships
      where user_id = auth.uid()
        and status = 'ACTIVE'
        and role in ('CLINIC_ADMIN', 'MANAGER')
    )
  );
