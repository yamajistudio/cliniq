-- ============================================================================
-- Migration 008: Criptografia de campos sensíveis com pgcrypto
-- ============================================================================

-- Garante que pgcrypto está ativo (já está na migration 001, mas por segurança)
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Funções auxiliares de criptografia simétrica
-- IMPORTANTE: configure a variável app.encryption_key antes de executar.
-- Opções:
--   a) ALTER DATABASE <db> SET app.encryption_key = '<chave>';
--   b) Supabase Vault: select vault.create_secret('<chave>', 'app.encryption_key');
-- ---------------------------------------------------------------------------

create or replace function crm_encrypt(plaintext text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if plaintext is null then return null; end if;
  return encode(
    pgp_sym_encrypt(plaintext, current_setting('app.encryption_key', true)),
    'base64'
  );
end;
$$;

create or replace function crm_decrypt(ciphertext text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if ciphertext is null then return null; end if;
  return pgp_sym_decrypt(
    decode(ciphertext, 'base64'),
    current_setting('app.encryption_key', true)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Adiciona coluna criptografada para CPF
-- A coluna original (cpf) é mantida em paralelo durante a transição.
-- ---------------------------------------------------------------------------

alter table patients add column if not exists cpf_encrypted text;

-- ---------------------------------------------------------------------------
-- Migração de dados existentes
-- ATENÇÃO: Execute este bloco APENAS UMA VEZ, em produção, após configurar
-- a chave de criptografia (app.encryption_key).
-- Descomente e execute manualmente via Supabase SQL Editor:
-- ---------------------------------------------------------------------------
-- update patients
-- set cpf_encrypted = crm_encrypt(cpf)
-- where cpf is not null
--   and cpf_encrypted is null;

-- ---------------------------------------------------------------------------
-- View para acesso transparente (apenas roles autorizadas)
-- Permite que código legado leia cpf descriptografado pelo alias "cpf"
-- enquanto a migração está em andamento.
-- ---------------------------------------------------------------------------

create or replace view patients_decrypted as
select
  id,
  clinic_id,
  full_name,
  crm_decrypt(cpf_encrypted) as cpf,
  email,
  phone,
  birth_date,
  gender,
  address,
  notes,
  source,
  status,
  created_by,
  created_at,
  updated_at
from patients;

-- Restringe acesso à view apenas para service_role (nunca anon/authenticated)
revoke all on patients_decrypted from anon, authenticated;
grant select on patients_decrypted to service_role;

-- ---------------------------------------------------------------------------
-- Documentação inline
-- ---------------------------------------------------------------------------

comment on column patients.cpf_encrypted is
  'CPF criptografado com pgp_sym_encrypt (pgcrypto). Use crm_decrypt() para leitura. '
  'Configure app.encryption_key via ALTER DATABASE ou Supabase Vault antes de usar.';

comment on function crm_encrypt(text) is
  'Criptografa texto com chave simétrica definida em app.encryption_key. '
  'Retorna base64 do resultado pgp_sym_encrypt.';

comment on function crm_decrypt(text) is
  'Descriptografa texto criptografado por crm_encrypt. '
  'Requer app.encryption_key configurada no banco.';
