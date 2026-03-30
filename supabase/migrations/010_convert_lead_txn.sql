-- ============================================================================
-- Migration 010: Stored procedure transacional para conversão de lead
-- ============================================================================
-- Garante atomicidade: cria paciente E atualiza lead em uma única transação.
-- Chamada pela Edge Function convert-lead-to-patient.

create or replace function convert_lead_to_patient_txn(
  p_lead_id   uuid,
  p_clinic_id uuid,
  p_actor_id  uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead      leads%rowtype;
  v_patient_id uuid;
begin
  -- Busca e valida o lead (FOR UPDATE previne conversão dupla concorrente)
  select * into v_lead
  from leads
  where id = p_lead_id
    and clinic_id = p_clinic_id
    and status != 'CONVERTED'
  for update;

  if not found then
    raise exception 'Lead não encontrado ou já convertido';
  end if;

  -- Cria o paciente a partir dos dados do lead
  insert into patients (
    clinic_id, full_name, phone, email, source, status, created_by
  )
  values (
    p_clinic_id,
    v_lead.full_name,
    v_lead.phone,
    v_lead.email,
    v_lead.source,
    'ACTIVE',
    p_actor_id
  )
  returning id into v_patient_id;

  -- Marca o lead como convertido e vincula ao paciente
  update leads
  set
    status               = 'CONVERTED',
    converted_patient_id = v_patient_id,
    updated_at           = now()
  where id = p_lead_id;

  -- Registra na auditoria
  insert into audit_logs (
    action, entity_type, entity_id, metadata, actor_user_id, clinic_id
  )
  values (
    'CONVERT',
    'lead',
    p_lead_id,
    jsonb_build_object(
      'patient_id', v_patient_id,
      'lead_name',  v_lead.full_name
    ),
    p_actor_id,
    p_clinic_id
  );

  return v_patient_id;
end;
$$;

-- Garante que apenas service_role pode chamar a função
revoke execute on function convert_lead_to_patient_txn(uuid, uuid, uuid) from public, anon, authenticated;
grant  execute on function convert_lead_to_patient_txn(uuid, uuid, uuid) to service_role;

comment on function convert_lead_to_patient_txn(uuid, uuid, uuid) is
  'Converte um lead em paciente de forma atômica. '
  'Chamada exclusivamente pela Edge Function convert-lead-to-patient. '
  'Requer service_role (sem acesso via anon/authenticated).';
