-- ============================================================================
-- CRM Clinicas — Migration 005: Settings Expansion
-- ============================================================================

-- ── Expandir clinics com cidade ──────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinics' and column_name = 'city'
  ) then
    alter table clinics add column city text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinics' and column_name = 'state'
  ) then
    alter table clinics add column state text;
  end if;
end $$;

-- ── Notification settings (1 por clínica) ────────────────────────────────────

create table if not exists notification_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,

  -- Confirmação de consulta
  confirm_enabled boolean not null default true,
  confirm_hours_before integer not null default 24,
  confirm_channel text not null default 'WHATSAPP',

  -- Lembrete automático
  reminder_enabled boolean not null default true,
  reminder_hours_before integer not null default 2,
  reminder_channel text not null default 'WHATSAPP',

  -- Follow-up pós consulta
  followup_enabled boolean not null default false,
  followup_days_after integer not null default 7,
  followup_channel text not null default 'WHATSAPP',

  -- Aniversário do paciente
  birthday_enabled boolean not null default false,

  updated_at timestamptz not null default now(),
  unique (clinic_id)
);

create trigger trg_notification_settings_updated_at
  before update on notification_settings
  for each row execute function crm_set_updated_at();

-- ── Staff invites (convite de equipe) ────────────────────────────────────────

create table if not exists staff_invites (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  email text not null,
  role text not null check (role in ('CLINIC_ADMIN', 'MANAGER', 'DOCTOR', 'RECEPTIONIST')),
  token uuid not null default gen_random_uuid(),
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (token),
  unique (clinic_id, email, status)
);

create index if not exists idx_staff_invites_clinic on staff_invites(clinic_id);
create index if not exists idx_staff_invites_token on staff_invites(token);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table notification_settings enable row level security;
alter table staff_invites enable row level security;

create policy "notification_settings_select" on notification_settings
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "notification_settings_insert" on notification_settings
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "notification_settings_update" on notification_settings
  for update using (clinic_id in (select crm_user_clinic_ids()));

create policy "staff_invites_select" on staff_invites
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "staff_invites_insert" on staff_invites
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "staff_invites_update" on staff_invites
  for update using (clinic_id in (select crm_user_clinic_ids()));
