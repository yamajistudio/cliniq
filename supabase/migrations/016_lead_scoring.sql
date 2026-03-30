-- ============================================================================
-- Migration 016: Lead Scoring
-- ============================================================================

-- Adiciona colunas de score na tabela leads
alter table leads
  add column if not exists score integer not null default 0
    check (score between 0 and 100),
  add column if not exists score_label text not null default 'COLD'
    check (score_label in ('COLD', 'WARM', 'HOT', 'VERY_HOT')),
  add column if not exists score_factors jsonb not null default '{}',
  add column if not exists score_updated_at timestamptz,
  -- Campos adicionais para enriquecer o scoring
  add column if not exists interest_level text
    check (interest_level in ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH')),
  add column if not exists response_time_minutes integer,
  add column if not exists total_interactions integer not null default 0,
  add column if not exists asked_about_price boolean not null default false,
  add column if not exists asked_about_availability boolean not null default false,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

-- Índice para listar leads por score
create index if not exists idx_leads_clinic_score
  on leads(clinic_id, score desc)
  where deleted_at is null;

-- Índice para leads quentes (score >= 70)
create index if not exists idx_leads_hot
  on leads(clinic_id, score desc)
  where score >= 70 and deleted_at is null and status not in ('CONVERTED', 'LOST');

-- ── Histórico de scoring ──────────────────────────────────────────────────────

create table if not exists lead_score_history (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references leads(id) on delete cascade,
  clinic_id       uuid not null references clinics(id) on delete cascade,
  score           integer not null,
  score_label     text not null,
  score_factors   jsonb not null default '{}',
  trigger_event   text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_lead_score_history_lead
  on lead_score_history(lead_id, created_at desc);

alter table lead_score_history enable row level security;

create policy "lead_score_history_select" on lead_score_history
  for select using (clinic_id in (select crm_user_clinic_ids()));

create policy "lead_score_history_insert" on lead_score_history
  for insert with check (clinic_id in (select crm_user_clinic_ids()));

-- ── Stored procedure de cálculo de score ─────────────────────────────────────

create or replace function calculate_lead_score(
  p_lead_id   uuid,
  p_clinic_id uuid,
  p_trigger   text default 'MANUAL_RECALC'
)
returns integer
language plpgsql
security definer
as $$
declare
  v_lead            leads%rowtype;
  v_score           integer := 0;
  v_factors         jsonb   := '{}';
  v_conv_count      integer;
  v_msg_count       bigint;
  v_last_msg_hours  numeric;
begin
  select * into v_lead from leads where id = p_lead_id and clinic_id = p_clinic_id;
  if not found then return 0; end if;

  -- ── Fator 1: Origem do lead (0-25 pts) ───────────────────────────────────
  case v_lead.source
    when 'GOOGLE'    then v_score := v_score + 25; v_factors := v_factors || '{"source": 25}';
    when 'INDICACAO' then v_score := v_score + 22; v_factors := v_factors || '{"source": 22}';
    when 'WHATSAPP'  then v_score := v_score + 18; v_factors := v_factors || '{"source": 18}';
    when 'WEBSITE'   then v_score := v_score + 15; v_factors := v_factors || '{"source": 15}';
    when 'INSTAGRAM' then v_score := v_score + 10; v_factors := v_factors || '{"source": 10}';
    else                  v_score := v_score + 5;  v_factors := v_factors || '{"source": 5}';
  end case;

  -- ── Fator 2: Status atual (0-20 pts) ─────────────────────────────────────
  case v_lead.status
    when 'QUALIFIED' then v_score := v_score + 20; v_factors := v_factors || '{"status": 20}';
    when 'CONTACTED' then v_score := v_score + 10; v_factors := v_factors || '{"status": 10}';
    when 'NEW'       then v_score := v_score + 5;  v_factors := v_factors || '{"status": 5}';
    else v_factors := v_factors || '{"status": 0}';
  end case;

  -- ── Fator 3: Engajamento em conversas (0-20 pts) ─────────────────────────
  select
    count(distinct c.id),
    coalesce(sum(
      (select count(*) from messages m
       where m.conversation_id = c.id and m.direction = 'INBOUND')
    ), 0)
  into v_conv_count, v_msg_count
  from conversations c
  where c.lead_id = p_lead_id and c.clinic_id = p_clinic_id;

  if    v_msg_count >= 10 then v_score := v_score + 20; v_factors := v_factors || '{"engagement": 20}';
  elsif v_msg_count >= 5  then v_score := v_score + 12; v_factors := v_factors || '{"engagement": 12}';
  elsif v_msg_count >= 2  then v_score := v_score + 6;  v_factors := v_factors || '{"engagement": 6}';
  elsif v_msg_count >= 1  then v_score := v_score + 3;  v_factors := v_factors || '{"engagement": 3}';
  else v_factors := v_factors || '{"engagement": 0}'; end if;

  -- ── Fator 4: Recência da última mensagem (0-15 pts) ──────────────────────
  select extract(epoch from (now() - max(m.sent_at))) / 3600
  into v_last_msg_hours
  from messages m
  join conversations c on c.id = m.conversation_id
  where c.lead_id = p_lead_id and m.direction = 'INBOUND';

  if v_last_msg_hours is not null then
    if    v_last_msg_hours <= 2  then v_score := v_score + 15; v_factors := v_factors || '{"recency": 15}';
    elsif v_last_msg_hours <= 24 then v_score := v_score + 10; v_factors := v_factors || '{"recency": 10}';
    elsif v_last_msg_hours <= 72 then v_score := v_score + 5;  v_factors := v_factors || '{"recency": 5}';
    else v_factors := v_factors || '{"recency": 0}'; end if;
  else
    v_factors := v_factors || '{"recency": 0}';
  end if;

  -- ── Fator 5: Intenção de compra (0-10 pts) ───────────────────────────────
  if v_lead.asked_about_price        then v_score := v_score + 5; v_factors := v_factors || '{"intent_price": 5}'; end if;
  if v_lead.asked_about_availability then v_score := v_score + 5; v_factors := v_factors || '{"intent_avail": 5}'; end if;

  -- ── Fator 6: Dados completos (0-10 pts) ──────────────────────────────────
  if v_lead.phone is not null then v_score := v_score + 3; v_factors := v_factors || '{"has_phone": 3}'; end if;
  if v_lead.email is not null then v_score := v_score + 4; v_factors := v_factors || '{"has_email": 4}'; end if;
  if v_lead.notes is not null and length(v_lead.notes) > 20
    then v_score := v_score + 3; v_factors := v_factors || '{"has_notes": 3}'; end if;

  -- Garante 0-100
  v_score := least(100, greatest(0, v_score));

  -- Atualiza lead
  update leads set
    score            = v_score,
    score_label      = case
                         when v_score >= 80 then 'VERY_HOT'
                         when v_score >= 60 then 'HOT'
                         when v_score >= 35 then 'WARM'
                         else 'COLD'
                       end,
    score_factors    = v_factors,
    score_updated_at = now()
  where id = p_lead_id;

  -- Registra histórico
  insert into lead_score_history
    (lead_id, clinic_id, score, score_label, score_factors, trigger_event)
  values (
    p_lead_id, p_clinic_id, v_score,
    case when v_score >= 80 then 'VERY_HOT'
         when v_score >= 60 then 'HOT'
         when v_score >= 35 then 'WARM'
         else 'COLD' end,
    v_factors, p_trigger
  );

  return v_score;
end;
$$;

-- ── Trigger: recalcula score após mudanças relevantes ─────────────────────────
-- Nota: a função não altera as colunas na cláusula OF, portanto não há loop.

create or replace function trg_recalculate_lead_score()
returns trigger language plpgsql as $$
begin
  perform calculate_lead_score(new.id, new.clinic_id, 'TRIGGER_UPDATE');
  return new;
end;
$$;

create trigger trg_leads_score_on_update
  after update of status, source, asked_about_price, asked_about_availability,
    phone, email, notes, total_interactions
  on leads
  for each row execute function trg_recalculate_lead_score();
