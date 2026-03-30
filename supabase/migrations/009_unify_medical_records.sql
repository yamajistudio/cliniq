-- ============================================================================
-- Migration 009: Unificação de medical_notes e medical_records
-- ============================================================================
-- Estratégia: medical_notes é a tabela unificada (mais antiga, mais simples
-- de manter). medical_records é marcada como DEPRECATED e será removida na 010.

-- ── 1. Adiciona campos de medical_records em medical_notes ───────────────────

alter table medical_notes
  add column if not exists diagnosis     text,
  add column if not exists prescription  text,
  add column if not exists professional_id uuid
    references professionals(id) on delete set null,
  add column if not exists updated_at    timestamptz not null default now();

-- ── 2. Trigger de updated_at para medical_notes ──────────────────────────────

create trigger trg_medical_notes_updated_at
  before update on medical_notes
  for each row execute function crm_set_updated_at();

-- ── 3. Índices adicionais ─────────────────────────────────────────────────────

create index if not exists idx_medical_notes_patient_clinic
  on medical_notes(patient_id, clinic_id);

create index if not exists idx_medical_notes_clinic_professional
  on medical_notes(clinic_id, professional_id);

-- ── 4. Migra dados de medical_records para medical_notes ─────────────────────
-- Usa ON CONFLICT DO NOTHING para evitar duplicatas no caso de
-- registros que já existam em medical_notes (por appointment_id).

insert into medical_notes (
  appointment_id,
  clinic_id,
  patient_id,
  doctor_id,
  professional_id,
  content,
  diagnosis,
  prescription,
  created_at
)
select
  mr.appointment_id,
  mr.clinic_id,
  mr.patient_id,
  coalesce(p.user_id, mr.created_by) as doctor_id,
  mr.professional_id,
  jsonb_build_object('notes', coalesce(mr.notes, '')) as content,
  mr.diagnosis,
  mr.prescription,
  mr.created_at
from medical_records mr
left join professionals p on p.id = mr.professional_id
where mr.appointment_id is not null
on conflict do nothing;

-- ── 5. Marca medical_records como deprecated ──────────────────────────────────

comment on table medical_records is
  'DEPRECATED: dados migrados para medical_notes. Tabela será removida na migration 010 '
  'após validação em produção. NÃO inserir novos registros aqui.';

-- ── 6. RLS adicional para os novos campos ─────────────────────────────────────
-- As políticas existentes em medical_notes já cobrem os novos campos pois
-- usam SELECT/INSERT/UPDATE por clinic_id via crm_user_clinic_ids().
-- Nenhuma policy adicional necessária.
