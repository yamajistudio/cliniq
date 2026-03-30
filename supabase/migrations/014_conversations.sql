-- ============================================================================
-- Migration 014: Sistema de Conversas e Mensagens (IA Conversacional)
-- ============================================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

do $$ begin
  create type conversation_channel as enum ('WHATSAPP', 'EMAIL', 'SMS', 'WEBCHAT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type conversation_status as enum ('OPEN', 'IN_PROGRESS', 'WAITING_PATIENT', 'RESOLVED', 'ESCALATED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_direction as enum ('INBOUND', 'OUTBOUND');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_type as enum ('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'TEMPLATE', 'INTERACTIVE', 'SYSTEM');
exception when duplicate_object then null; end $$;

-- ── conversations ─────────────────────────────────────────────────────────────

create table if not exists conversations (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics(id) on delete cascade,
  channel             conversation_channel not null default 'WHATSAPP',
  -- Identificador do contato no canal (ex: número WhatsApp com DDI: "5511999990000")
  contact_identifier  text not null,
  contact_name        text,
  contact_phone       text,
  contact_email       text,
  -- Lead ou paciente vinculado (pode ser null se ainda não identificado)
  lead_id             uuid references leads(id) on delete set null,
  patient_id          uuid references patients(id) on delete set null,
  -- Atendente humano responsável (null = atendimento pela IA)
  assigned_to         uuid references auth.users(id) on delete set null,
  status              conversation_status not null default 'OPEN',
  -- Metadados do canal (ex: phone_number_id, thread_id, etc.)
  channel_metadata    jsonb not null default '{}',
  -- Contexto acumulado para o LLM (resumo da conversa, intenções detectadas)
  ai_context          jsonb not null default '{}',
  last_message_at     timestamptz,
  resolved_at         timestamptz,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_conversations_clinic
  on conversations(clinic_id) where deleted_at is null;

create index if not exists idx_conversations_contact
  on conversations(clinic_id, contact_identifier) where deleted_at is null;

create index if not exists idx_conversations_status
  on conversations(clinic_id, status) where deleted_at is null;

create index if not exists idx_conversations_lead
  on conversations(lead_id) where lead_id is not null;

create index if not exists idx_conversations_patient
  on conversations(patient_id) where patient_id is not null;

-- Evita conversas duplicadas abertas para o mesmo contato no mesmo canal
create unique index if not exists idx_conversations_active_contact
  on conversations(clinic_id, channel, contact_identifier)
  where status not in ('RESOLVED') and deleted_at is null;

create trigger trg_conversations_updated_at
  before update on conversations
  for each row execute function crm_set_updated_at();

-- ── messages ──────────────────────────────────────────────────────────────────

create table if not exists messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references conversations(id) on delete cascade,
  clinic_id           uuid not null references clinics(id) on delete cascade,
  direction           message_direction not null,
  message_type        message_type not null default 'TEXT',
  content             text,
  -- Metadados ricos: mídia, botões, listas interativas, etc.
  payload             jsonb not null default '{}',
  -- ID da mensagem no canal externo (para deduplicação)
  external_message_id text,
  -- Se foi enviada pela IA ou por humano
  sent_by_ai          boolean not null default false,
  sent_by_user_id     uuid references auth.users(id) on delete set null,
  -- Status de entrega (para outbound)
  delivery_status     text default 'PENDING'
    check (delivery_status in ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
  error_details       jsonb,
  sent_at             timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index if not exists idx_messages_conversation
  on messages(conversation_id, sent_at desc);

create index if not exists idx_messages_clinic
  on messages(clinic_id, sent_at desc);

create unique index if not exists idx_messages_external_id
  on messages(clinic_id, external_message_id)
  where external_message_id is not null;

-- ── ai_interactions ───────────────────────────────────────────────────────────
-- Rastreia uso do LLM para controle de custos e análise de qualidade

create table if not exists ai_interactions (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics(id) on delete cascade,
  conversation_id     uuid references conversations(id) on delete set null,
  message_id          uuid references messages(id) on delete set null,
  model               text not null,
  intent_detected     text,
  confidence_score    numeric(4,3) check (confidence_score between 0 and 1),
  prompt_tokens       integer not null default 0,
  completion_tokens   integer not null default 0,
  action_taken        text,
  action_payload      jsonb,
  escalated_to_human  boolean not null default false,
  escalation_reason   text,
  latency_ms          integer,
  created_at          timestamptz not null default now()
);

create index if not exists idx_ai_interactions_clinic
  on ai_interactions(clinic_id, created_at desc);

create index if not exists idx_ai_interactions_conversation
  on ai_interactions(conversation_id);

-- ── webhook_events ────────────────────────────────────────────────────────────
-- Fila de eventos recebidos de canais externos antes do processamento assíncrono

create table if not exists webhook_events (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid references clinics(id) on delete cascade,
  channel             conversation_channel not null,
  -- Identificador da conta no canal (ex: phone_number_id do WhatsApp Business)
  channel_account_id  text not null,
  event_type          text not null,
  payload             jsonb not null,
  status              text not null default 'PENDING'
    check (status in ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'DUPLICATE')),
  attempts            integer not null default 0,
  last_error          text,
  processed_at        timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_webhook_events_pending
  on webhook_events(status, created_at)
  where status in ('PENDING', 'FAILED');

create index if not exists idx_webhook_events_channel
  on webhook_events(channel_account_id, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table conversations   enable row level security;
alter table messages        enable row level security;
alter table ai_interactions enable row level security;
alter table webhook_events  enable row level security;

-- conversations
create policy "conversations_select" on conversations
  for select using (clinic_id in (select crm_user_clinic_ids()) and deleted_at is null);
create policy "conversations_insert" on conversations
  for insert with check (clinic_id in (select crm_user_clinic_ids()));
create policy "conversations_update" on conversations
  for update using (clinic_id in (select crm_user_clinic_ids()));
create policy "conversations_delete" on conversations
  for delete using (clinic_id in (select crm_user_clinic_ids()));

-- messages (append-only para usuários autenticados — service_role pode atualizar)
create policy "messages_select" on messages
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "messages_insert" on messages
  for insert with check (clinic_id in (select crm_user_clinic_ids()));

-- ai_interactions (somente leitura e insert para usuários autenticados)
create policy "ai_interactions_select" on ai_interactions
  for select using (clinic_id in (select crm_user_clinic_ids()));
create policy "ai_interactions_insert" on ai_interactions
  for insert with check (clinic_id in (select crm_user_clinic_ids()));

-- webhook_events: apenas service_role pode inserir (via Edge Function)
-- usuários autenticados podem ler para monitoramento
create policy "webhook_events_select" on webhook_events
  for select using (clinic_id in (select crm_user_clinic_ids()));
