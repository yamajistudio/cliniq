-- ============================================================================
-- CRM Clinicas — Migration 006: SaaS Features
-- Onboarding, Payments, Medical Records, Plans, Subscriptions, Trial
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- TAREFA 2: onboarding_progress
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  step text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (clinic_id, step)
);

create index if not exists idx_onboarding_clinic on onboarding_progress(clinic_id);

alter table onboarding_progress enable row level security;
create policy "onboarding_progress_select" on onboarding_progress
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "onboarding_progress_insert" on onboarding_progress
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "onboarding_progress_update" on onboarding_progress
  for update using (clinic_id in (select crm_user_clinic_ids()));

-- ══════════════════════════════════════════════════════════════════════════════
-- TAREFA 3: payments
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'REFUNDED')),
  payment_method text check (payment_method in ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'CONVENIO', 'OUTRO')),
  paid_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_clinic on payments(clinic_id);
create index if not exists idx_payments_patient on payments(patient_id);
create index if not exists idx_payments_appointment on payments(appointment_id);
create index if not exists idx_payments_status on payments(clinic_id, status);
create index if not exists idx_payments_paid_at on payments(clinic_id, paid_at);

create trigger trg_payments_updated_at
  before update on payments for each row execute function crm_set_updated_at();

alter table payments enable row level security;
create policy "payments_select" on payments
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "payments_insert" on payments
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "payments_update" on payments
  for update using (clinic_id in (select crm_user_clinic_ids()));

-- ══════════════════════════════════════════════════════════════════════════════
-- TAREFA 4: medical_records
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists medical_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  appointment_id uuid not null references appointments(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  professional_id uuid references professionals(id) on delete set null,
  notes text,
  diagnosis text,
  prescription text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_medical_records_appointment on medical_records(appointment_id);
create index if not exists idx_medical_records_patient on medical_records(patient_id);
create index if not exists idx_medical_records_clinic on medical_records(clinic_id);

create trigger trg_medical_records_updated_at
  before update on medical_records for each row execute function crm_set_updated_at();

alter table medical_records enable row level security;
create policy "medical_records_select" on medical_records
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "medical_records_insert" on medical_records
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "medical_records_update" on medical_records
  for update using (clinic_id in (select crm_user_clinic_ids()));

-- ══════════════════════════════════════════════════════════════════════════════
-- TAREFA 6+7: plans + subscriptions (com trial)
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  price numeric(10,2) not null default 0,
  max_professionals integer not null default 1,
  max_patients integer not null default 50,
  max_appointments_month integer not null default 100,
  features jsonb not null default '[]',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  plan_id uuid not null references plans(id) on delete restrict,
  status text not null default 'TRIAL' check (status in ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  trial_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id)
);

create index if not exists idx_subscriptions_clinic on subscriptions(clinic_id);
create index if not exists idx_subscriptions_status on subscriptions(status);

create trigger trg_subscriptions_updated_at
  before update on subscriptions for each row execute function crm_set_updated_at();

alter table plans enable row level security;
alter table subscriptions enable row level security;

-- Plans: readable by everyone authenticated
create policy "plans_select" on plans for select to authenticated using (true);

-- Subscriptions: only own clinic
create policy "subscriptions_select" on subscriptions
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "subscriptions_insert" on subscriptions
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "subscriptions_update" on subscriptions
  for update using (clinic_id in (select crm_user_clinic_ids()));

-- ── Seed default plans ───────────────────────────────────────────────────────

insert into plans (name, slug, price, max_professionals, max_patients, max_appointments_month, features, sort_order)
values
  ('Starter', 'starter', 97.00, 2, 100, 200,
   '["Agenda", "Pacientes", "Leads", "Dashboard"]'::jsonb, 1),
  ('Pro', 'pro', 197.00, 5, 500, 1000,
   '["Tudo do Starter", "Financeiro", "Prontuário", "Notificações", "Relatórios"]'::jsonb, 2),
  ('Clínica+', 'clinica-plus', 397.00, 20, 5000, 10000,
   '["Tudo do Pro", "Multi-unidade", "API", "Suporte prioritário", "Agendamento online"]'::jsonb, 3)
on conflict (slug) do nothing;
