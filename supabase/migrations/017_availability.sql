-- ============================================================================
-- Migration 017: Motor de disponibilidade para agendamento automático
-- ============================================================================

-- ── get_available_slots ───────────────────────────────────────────────────────
-- Retorna todos os slots (disponíveis e não disponíveis) para um profissional
-- em uma data específica, respeitando a agenda configurada e agendamentos existentes.

create or replace function get_available_slots(
  p_clinic_id              uuid,
  p_professional_id        uuid,
  p_date                   date,
  p_service_duration_minutes integer default 30
)
returns table (
  slot_start   timestamptz,
  slot_end     timestamptz,
  is_available boolean
)
language plpgsql
stable
security definer
as $$
declare
  v_schedule      professional_schedules%rowtype;
  v_day_of_week   integer;
  v_slot_start    timestamptz;
  v_slot_end      timestamptz;
  v_clinic_tz     text;
  v_slot_duration integer;
  v_buffer        integer;
  v_is_occupied   boolean;
begin
  v_day_of_week := extract(dow from p_date);

  -- Timezone da clínica (fallback: America/Sao_Paulo)
  select coalesce(
    (select timezone from clinic_settings where clinic_id = p_clinic_id limit 1),
    'America/Sao_Paulo'
  ) into v_clinic_tz;

  -- Buffer de agendamentos
  select coalesce(
    (select appointment_buffer_minutes from clinic_settings where clinic_id = p_clinic_id limit 1),
    0
  ) into v_buffer;

  -- Agenda do profissional para o dia
  select * into v_schedule
  from professional_schedules
  where professional_id = p_professional_id
    and clinic_id       = p_clinic_id
    and day_of_week     = v_day_of_week
    and is_active       = true;

  if not found then return; end if;

  v_slot_duration := coalesce(v_schedule.slot_duration_minutes, p_service_duration_minutes);

  -- Primeiro slot do dia na timezone da clínica
  v_slot_start := (p_date::text || ' ' || v_schedule.start_time::text)::timestamp
    at time zone v_clinic_tz;

  -- Itera cada slot do dia
  loop
    v_slot_end := v_slot_start + (p_service_duration_minutes * interval '1 minute');

    -- Não ultrapassa o fim do expediente
    exit when v_slot_end >
      (p_date::text || ' ' || v_schedule.end_time::text)::timestamp at time zone v_clinic_tz;

    -- Verifica conflito com agendamentos existentes (incluindo buffer)
    select exists(
      select 1 from appointments
      where professional_id = p_professional_id
        and clinic_id       = p_clinic_id
        and deleted_at      is null
        and status          not in ('CANCELLED', 'NO_SHOW')
        and starts_at < v_slot_end   + (v_buffer * interval '1 minute')
        and ends_at   > v_slot_start - (v_buffer * interval '1 minute')
    ) into v_is_occupied;

    slot_start   := v_slot_start;
    slot_end     := v_slot_end;
    is_available := not v_is_occupied and v_slot_start > now();
    return next;

    v_slot_start := v_slot_start + (v_slot_duration * interval '1 minute');
  end loop;
end;
$$;

-- ── get_next_available_slots ──────────────────────────────────────────────────
-- Retorna os próximos N slots disponíveis a partir de uma data.
-- Usado pela IA para propor opções ao paciente.

create or replace function get_next_available_slots(
  p_clinic_id       uuid,
  p_professional_id uuid,
  p_service_id      uuid,
  p_from_date       date    default current_date,
  p_limit           integer default 3
)
returns table (
  slot_start        timestamptz,
  slot_end          timestamptz,
  professional_name text,
  service_name      text
)
language plpgsql
stable
security definer
as $$
declare
  v_duration  integer;
  v_check     date := p_from_date;
  v_found     integer := 0;
  v_prof_name text;
  v_svc_name  text;
  v_slot_rec  record;
begin
  select coalesce(duration_minutes, 30) into v_duration
  from services_catalog where id = p_service_id and clinic_id = p_clinic_id;

  select full_name into v_prof_name
  from professionals where id = p_professional_id and clinic_id = p_clinic_id;

  select name into v_svc_name
  from services_catalog where id = p_service_id and clinic_id = p_clinic_id;

  while v_found < p_limit and v_check <= p_from_date + 30
  loop
    for v_slot_rec in
      select s.slot_start, s.slot_end
      from get_available_slots(p_clinic_id, p_professional_id, v_check, v_duration) s
      where s.is_available
      order by s.slot_start
    loop
      exit when v_found >= p_limit;
      slot_start        := v_slot_rec.slot_start;
      slot_end          := v_slot_rec.slot_end;
      professional_name := v_prof_name;
      service_name      := v_svc_name;
      return next;
      v_found := v_found + 1;
    end loop;
    v_check := v_check + 1;
  end loop;
end;
$$;

-- ── book_appointment_ai ───────────────────────────────────────────────────────
-- Cria um agendamento confirmado atomicamente com verificação de conflito.
-- Retorna o UUID do agendamento criado ou lança exceção se o slot não está mais disponível.

create or replace function book_appointment_ai(
  p_clinic_id       uuid,
  p_patient_id      uuid,
  p_professional_id uuid,
  p_service_id      uuid,
  p_starts_at       timestamptz,
  p_conversation_id uuid,
  p_lead_id         uuid default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_duration  integer;
  v_ends_at   timestamptz;
  v_appt_id   uuid;
  v_buffer    integer;
  v_conflict  boolean;
begin
  select coalesce(duration_minutes, 30) into v_duration
  from services_catalog where id = p_service_id and clinic_id = p_clinic_id;

  select coalesce(appointment_buffer_minutes, 0) into v_buffer
  from clinic_settings where clinic_id = p_clinic_id;

  v_ends_at := p_starts_at + (v_duration * interval '1 minute');

  -- Trava as linhas conflitantes para evitar double-booking concorrente
  select exists(
    select 1 from appointments
    where professional_id = p_professional_id
      and clinic_id       = p_clinic_id
      and deleted_at      is null
      and status          not in ('CANCELLED', 'NO_SHOW')
      and starts_at < v_ends_at   + (v_buffer * interval '1 minute')
      and ends_at   > p_starts_at - (v_buffer * interval '1 minute')
    for update skip locked
  ) into v_conflict;

  if v_conflict then
    raise exception 'Horário não disponível: conflito detectado para o profissional neste horário.';
  end if;

  -- Cria o agendamento como CONFIRMED
  insert into appointments (
    clinic_id, patient_id, professional_id, service_id,
    starts_at, ends_at, status, notes, confirmed_at
  ) values (
    p_clinic_id, p_patient_id, p_professional_id, p_service_id,
    p_starts_at, v_ends_at,
    'CONFIRMED',
    'Agendado automaticamente via WhatsApp',
    now()
  ) returning id into v_appt_id;

  -- Vincula o agendamento ao contexto da conversa de IA
  update conversations
  set ai_context = ai_context || jsonb_build_object('last_appointment_id', v_appt_id::text)
  where id = p_conversation_id;

  -- Se veio de um lead, avança o status para QUALIFIED
  if p_lead_id is not null then
    update leads
    set status = 'QUALIFIED'
    where id = p_lead_id and status not in ('CONVERTED', 'LOST');
  end if;

  -- Cria follow-up de lembrete para 24h antes
  insert into follow_ups (clinic_id, patient_id, appointment_id, scheduled_for, notes)
  values (
    p_clinic_id,
    p_patient_id,
    v_appt_id,
    (p_starts_at - interval '1 day')::date,
    'Lembrete automático — 24h antes da consulta'
  );

  return v_appt_id;
end;
$$;
