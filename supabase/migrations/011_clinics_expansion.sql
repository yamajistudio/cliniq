-- ============================================================================
-- Migration 011: Expansão da tabela clinics para mercado de saúde BR
--                + clinic_groups para redes/franquias
-- ============================================================================
-- Nota: clinics já possui name, legal_name, tax_id, phone, email, address,
--       logo_path, city, state, created_at, updated_at (migrations 001 + 005).

-- ── 1. Novos campos em clinics ────────────────────────────────────────────────

alter table clinics
  add column if not exists cnpj         text,
  add column if not exists cnes         text,        -- Cadastro Nacional de Estabelecimentos de Saúde
  add column if not exists ans_code     text,        -- Registro ANS (se for operadora de convênio)
  add column if not exists timezone     text not null default 'America/Sao_Paulo',
  add column if not exists locale       text not null default 'pt-BR',
  add column if not exists logo_url     text,        -- URL pública (Supabase Storage)
  add column if not exists website_url  text,
  add column if not exists specialty    text,        -- especialidade principal (ex: 'Odontologia')
  add column if not exists is_active    boolean not null default true,
  add column if not exists deleted_at   timestamptz; -- soft delete

-- Índice único para CNPJ (apenas quando preenchido)
create unique index if not exists idx_clinics_cnpj
  on clinics(cnpj)
  where cnpj is not null;

-- Índice único para CNES (apenas quando preenchido)
create unique index if not exists idx_clinics_cnes
  on clinics(cnes)
  where cnes is not null;

comment on column clinics.cnes     is 'Cadastro Nacional de Estabelecimentos de Saúde — obrigatório para convênios';
comment on column clinics.ans_code is 'Registro ANS — obrigatório para operadoras de planos de saúde';
comment on column clinics.timezone is 'Timezone IANA (ex: America/Sao_Paulo, America/Manaus)';

-- Atualiza RLS para excluir clínicas soft-deleted
drop policy if exists "clinics_select" on clinics;
create policy "clinics_select" on clinics
  for select using (
    id in (select crm_user_clinic_ids())
    and deleted_at is null
  );

-- ── 2. clinic_groups: suporte a redes/franquias ───────────────────────────────

create table if not exists clinic_groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  legal_name    text,
  cnpj          text,
  logo_url      text,
  owner_user_id uuid references auth.users(id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_clinic_groups_updated_at
  before update on clinic_groups
  for each row execute function crm_set_updated_at();

-- Associação clínica → grupo (1 clínica pertence a no máximo 1 grupo)
alter table clinics
  add column if not exists group_id uuid references clinic_groups(id) on delete set null;

create index if not exists idx_clinics_group
  on clinics(group_id)
  where group_id is not null;

-- ── RLS para clinic_groups ────────────────────────────────────────────────────

alter table clinic_groups enable row level security;

-- Usuário vê o grupo se for membro de alguma clínica que pertence a ele
create policy "clinic_groups_select" on clinic_groups
  for select using (
    id in (
      select group_id
      from clinics
      where id in (select crm_user_clinic_ids())
        and group_id is not null
    )
  );

-- Apenas o owner pode atualizar o grupo
create policy "clinic_groups_update" on clinic_groups
  for update using (owner_user_id = auth.uid());

-- Owner pode inserir grupos
create policy "clinic_groups_insert" on clinic_groups
  for insert with check (owner_user_id = auth.uid());
