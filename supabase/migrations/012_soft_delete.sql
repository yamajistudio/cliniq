-- ============================================================================
-- Migration 012: Soft delete em tabelas principais
-- ============================================================================
-- audit_logs e appointment_status_history são intencionalmente excluídas:
-- são registros de imutabilidade por design (append-only).

-- ── 1. Adiciona deleted_at nas tabelas principais ─────────────────────────────

alter table patients          add column if not exists deleted_at timestamptz;
alter table leads             add column if not exists deleted_at timestamptz;
alter table appointments      add column if not exists deleted_at timestamptz;
alter table professionals     add column if not exists deleted_at timestamptz;
alter table services_catalog  add column if not exists deleted_at timestamptz;
alter table payments          add column if not exists deleted_at timestamptz;
alter table medical_notes     add column if not exists deleted_at timestamptz;
alter table follow_ups        add column if not exists deleted_at timestamptz;

-- ── 2. Índices parciais para queries de registros não deletados ───────────────
-- Partial indexes economizam espaço e aumentam a performance:
-- só indexam registros onde deleted_at IS NULL (os que realmente importam nas queries).

create index if not exists idx_patients_not_deleted
  on patients(clinic_id) where deleted_at is null;

create index if not exists idx_leads_not_deleted
  on leads(clinic_id) where deleted_at is null;

create index if not exists idx_appointments_not_deleted
  on appointments(clinic_id, starts_at) where deleted_at is null;

create index if not exists idx_professionals_not_deleted
  on professionals(clinic_id) where deleted_at is null;

create index if not exists idx_services_catalog_not_deleted
  on services_catalog(clinic_id) where deleted_at is null;

create index if not exists idx_payments_not_deleted
  on payments(clinic_id) where deleted_at is null;

create index if not exists idx_medical_notes_not_deleted
  on medical_notes(clinic_id) where deleted_at is null;

create index if not exists idx_follow_ups_not_deleted
  on follow_ups(clinic_id) where deleted_at is null;

-- ── 3. Atualiza RLS SELECT para excluir registros soft-deleted ────────────────

-- patients
drop policy if exists "patients_select" on patients;
create policy "patients_select" on patients
  for select using (
    clinic_id in (select crm_user_clinic_ids())
    and deleted_at is null
  );

-- leads
drop policy if exists "leads_select" on leads;
create policy "leads_select" on leads
  for select using (
    clinic_id in (select crm_user_clinic_ids())
    and deleted_at is null
  );

-- appointments
drop policy if exists "appointments_select" on appointments;
create policy "appointments_select" on appointments
  for select using (
    clinic_id in (select crm_user_clinic_ids())
    and deleted_at is null
  );

-- professionals
drop policy if exists "professionals_select" on professionals;
create policy "professionals_select" on professionals
  for select using (
    clinic_id in (select crm_user_clinic_ids())
    and deleted_at is null
  );

-- services_catalog
drop policy if exists "services_catalog_select" on services_catalog;
create policy "services_catalog_select" on services_catalog
  for select using (
    clinic_id in (select crm_user_clinic_ids())
    and deleted_at is null
  );

-- payments
drop policy if exists "payments_select" on payments;
create policy "payments_select" on payments
  for select using (
    clinic_id in (select crm_user_clinic_ids())
    and deleted_at is null
  );

-- medical_notes
drop policy if exists "medical_notes_select" on medical_notes;
create policy "medical_notes_select" on medical_notes
  for select using (
    clinic_id in (select crm_user_clinic_ids())
    and deleted_at is null
  );

-- follow_ups
drop policy if exists "follow_ups_select" on follow_ups;
create policy "follow_ups_select" on follow_ups
  for select using (
    clinic_id in (select crm_user_clinic_ids())
    and deleted_at is null
  );

-- ── 4. Função utilitária de soft delete ───────────────────────────────────────
-- Uso: select soft_delete_record('patients', '<uuid>', '<clinic_uuid>');
-- Chamada de serviços que precisam de soft delete direto (sem passar pelo ORM).
-- O parâmetro p_table é sanitizado com %I para prevenir SQL injection.

create or replace function soft_delete_record(
  p_table    text,
  p_id       uuid,
  p_clinic_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute format(
    'update %I set deleted_at = now() where id = $1 and clinic_id = $2 and deleted_at is null',
    p_table
  ) using p_id, p_clinic_id;
end;
$$;

comment on function soft_delete_record(text, uuid, uuid) is
  'Aplica soft delete genérico em qualquer tabela com colunas id, clinic_id e deleted_at. '
  'Use apenas em contexts confiáveis — p_table deve ser uma constante do código, '
  'nunca input direto do usuário.';
