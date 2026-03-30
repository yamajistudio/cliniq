-- ============================================================================
-- CRM Clinicas — Migration 007: P0 Security Fixes
-- 1. Add DELETE policies to all tables missing them
-- 2. Add clinic_id to audit_logs + fix policies (cross-tenant leak)
-- 3. Fix profiles SELECT policy (allow reading within same clinic)
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. ADD MISSING DELETE POLICIES
-- Tables that had SELECT + INSERT + UPDATE but NO DELETE
-- ══════════════════════════════════════════════════════════════════════════════

-- patients
create policy "patients_delete" on patients
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- leads
create policy "leads_delete" on leads
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- appointments
create policy "appointments_delete" on appointments
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- services_catalog
create policy "services_catalog_delete" on services_catalog
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- medical_notes (original table from migration 001)
create policy "medical_notes_update" on medical_notes
  for update using (clinic_id in (select crm_user_clinic_ids()));
create policy "medical_notes_delete" on medical_notes
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- follow_ups
create policy "follow_ups_delete" on follow_ups
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- attachments
create policy "attachments_update" on attachments
  for update using (clinic_id in (select crm_user_clinic_ids()));
create policy "attachments_delete" on attachments
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- payments
create policy "payments_delete" on payments
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- medical_records
create policy "medical_records_delete" on medical_records
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- onboarding_progress
create policy "onboarding_progress_delete" on onboarding_progress
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- clinic_settings
create policy "clinic_settings_delete" on clinic_settings
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- notification_settings
create policy "notification_settings_delete" on notification_settings
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- staff_invites
create policy "staff_invites_delete" on staff_invites
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- appointment_status_history
create policy "appt_status_history_delete" on appointment_status_history
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. FIX audit_logs: ADD clinic_id + FIX POLICIES (cross-tenant leak)
-- ══════════════════════════════════════════════════════════════════════════════

-- Add clinic_id column (nullable initially to not break existing rows)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'audit_logs'
      and column_name = 'clinic_id'
  ) then
    alter table audit_logs
      add column clinic_id uuid references clinics(id) on delete cascade;
    create index idx_audit_logs_clinic on audit_logs(clinic_id);
  end if;
end $$;

-- Drop old policies that allow cross-tenant reads
drop policy if exists "audit_logs_select" on audit_logs;
drop policy if exists "audit_logs_insert" on audit_logs;

-- New INSERT: requires clinic_id to be in user's clinics
create policy "audit_logs_insert_v2" on audit_logs
  for insert with check (
    actor_user_id = auth.uid()
    and (
      clinic_id is null
      or clinic_id in (select crm_user_clinic_ids())
    )
  );

-- New SELECT: only logs from user's clinics (or system logs with null clinic_id)
create policy "audit_logs_select_v2" on audit_logs
  for select using (
    clinic_id in (select crm_user_clinic_ids())
    or (
      clinic_id is null
      and actor_user_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. FIX profiles SELECT: allow reading profiles of same-clinic members
-- ══════════════════════════════════════════════════════════════════════════════

drop policy if exists "profiles_select_own" on profiles;

create policy "profiles_select_v2" on profiles
  for select using (
    -- Own profile
    id = auth.uid()
    -- Or profiles of users in the same clinic(s)
    or id in (
      select cm2.user_id
      from clinic_memberships cm1
      join clinic_memberships cm2 on cm1.clinic_id = cm2.clinic_id
      where cm1.user_id = auth.uid()
        and cm1.status = 'ACTIVE'
        and cm2.status = 'ACTIVE'
    )
  );
