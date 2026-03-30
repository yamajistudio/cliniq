-- ============================================================================
-- Migration 015: Configurações de integração WhatsApp por clínica
-- ============================================================================

alter table clinic_settings
  add column if not exists whatsapp_phone_number_id text,
  add column if not exists whatsapp_enabled          boolean not null default false;

comment on column clinic_settings.whatsapp_phone_number_id is
  'ID do número de telefone no Meta Business (phone_number_id)';
comment on column clinic_settings.whatsapp_enabled is
  'Ativa ou desativa o recebimento de mensagens WhatsApp para esta clínica';
