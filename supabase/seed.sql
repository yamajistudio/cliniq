-- ============================================================================
-- CRM Clínicas — Seed de Demonstração
-- ============================================================================
-- 
-- INSTRUÇÕES:
-- 1. Rode as migrations 001-004 ANTES deste seed.
-- 2. Crie um usuário no Supabase Auth (email: admin@clinicademo.com, senha: demo123456).
-- 3. Anote o UUID do usuário criado.
-- 4. Substitua TODAS as ocorrências de __USER_ID__ pelo UUID real.
-- 5. Execute este SQL no SQL Editor do Supabase.
--
-- O seed cria:
--   1 clínica · 1 profile · 1 membership (CLINIC_ADMIN)
--   3 profissionais · horários para cada um
--   6 serviços
--   20 pacientes
--   8 leads
--   15+ agendamentos (passados, hoje, futuros)
--   histórico de status
--   follow-ups
--   clinic_settings
-- ============================================================================

-- ── Limpar dados anteriores (safe para re-run) ──────────────────────────────

do $$
declare
  v_clinic_id uuid;
begin
  select id into v_clinic_id from clinics where name = 'Clínica Vida & Saúde' limit 1;
  if v_clinic_id is not null then
    delete from appointment_status_history where clinic_id = v_clinic_id;
    delete from follow_ups where clinic_id = v_clinic_id;
    delete from appointments where clinic_id = v_clinic_id;
    delete from leads where clinic_id = v_clinic_id;
    delete from patients where clinic_id = v_clinic_id;
    delete from professional_schedules where clinic_id = v_clinic_id;
    delete from professionals where clinic_id = v_clinic_id;
    delete from services_catalog where clinic_id = v_clinic_id;
    delete from clinic_settings where clinic_id = v_clinic_id;
    delete from clinic_memberships where clinic_id = v_clinic_id;
    delete from audit_logs where entity_id = v_clinic_id;
    delete from clinics where id = v_clinic_id;
  end if;
end $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. CLÍNICA
-- ══════════════════════════════════════════════════════════════════════════════

insert into clinics (id, name, legal_name, tax_id, phone, email, address)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Clínica Vida & Saúde',
  'Vida e Saúde Ltda',
  '12.345.678/0001-90',
  '(71) 3333-4444',
  'contato@vidaesaude.com.br',
  'Rua da Saúde, 100 - Pituba, Salvador - BA'
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. PROFILE + MEMBERSHIP (substitua __USER_ID__)
-- ══════════════════════════════════════════════════════════════════════════════

-- ⚠️ SUBSTITUA __USER_ID__ pelo UUID do usuário criado no Supabase Auth
insert into profiles (id, full_name, email, phone)
values (
  '__USER_ID__',
  'Administrador Demo',
  'admin@clinicademo.com',
  '(71) 99999-0001'
) on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email;

insert into clinic_memberships (clinic_id, user_id, role, status)
values (
  'a0000000-0000-0000-0000-000000000001',
  '__USER_ID__',
  'CLINIC_ADMIN',
  'ACTIVE'
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. CLINIC SETTINGS
-- ══════════════════════════════════════════════════════════════════════════════

insert into clinic_settings (
  clinic_id, opening_time, closing_time, slot_duration_minutes,
  days_open, lunch_start, lunch_end, timezone
) values (
  'a0000000-0000-0000-0000-000000000001',
  '08:00', '18:00', 30,
  '{1,2,3,4,5,6}',
  '12:00', '13:00',
  'America/Sao_Paulo'
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. PROFISSIONAIS
-- ══════════════════════════════════════════════════════════════════════════════

insert into professionals (id, clinic_id, full_name, specialty, license_number, phone, email, color, is_active)
values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Dra. Ana Beatriz Costa', 'Dermatologista', 'CRM 45678/BA', '(71) 99999-1001', 'ana.costa@vidaesaude.com.br', '#8B5CF6', true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Dr. Carlos Eduardo Mendes', 'Clínico Geral', 'CRM 56789/BA', '(71) 99999-1002', 'carlos.mendes@vidaesaude.com.br', '#3B82F6', true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'Dra. Fernanda Lima', 'Nutricionista', 'CRN 12345/BA', '(71) 99999-1003', 'fernanda.lima@vidaesaude.com.br', '#22C55E', true);

-- Horários: Dra. Ana (seg-sex 09-17)
insert into professional_schedules (professional_id, clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1, '09:00', '17:00', 30, true),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 2, '09:00', '17:00', 30, true),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 3, '09:00', '17:00', 30, true),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 4, '09:00', '17:00', 30, true),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 5, '09:00', '17:00', 30, true);

-- Horários: Dr. Carlos (seg-sab 08-18, 45min)
insert into professional_schedules (professional_id, clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
values
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 1, '08:00', '18:00', 45, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2, '08:00', '18:00', 45, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 3, '08:00', '18:00', 45, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 4, '08:00', '18:00', 45, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 5, '08:00', '18:00', 45, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 6, '08:00', '12:00', 45, true);

-- Horários: Dra. Fernanda (seg, qua, sex 10-16, 60min)
insert into professional_schedules (professional_id, clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
values
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 1, '10:00', '16:00', 60, true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 3, '10:00', '16:00', 60, true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 5, '10:00', '16:00', 60, true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. SERVIÇOS
-- ══════════════════════════════════════════════════════════════════════════════

insert into services_catalog (id, clinic_id, name, description, duration_minutes, price, is_active)
values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Consulta Clínica Geral', 'Avaliação médica geral com anamnese completa', 45, 250.00, true),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Consulta Dermatológica', 'Avaliação de pele, cabelo e unhas', 30, 350.00, true),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'Consulta Nutricional', 'Avaliação nutricional e plano alimentar', 60, 280.00, true),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'Retorno', 'Consulta de retorno / acompanhamento', 20, 120.00, true),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'Peeling Químico', 'Procedimento estético facial', 45, 450.00, true),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'Bioimpedância', 'Avaliação de composição corporal', 30, 150.00, true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. PACIENTES (20)
-- ══════════════════════════════════════════════════════════════════════════════

insert into patients (id, clinic_id, full_name, cpf, email, phone, birth_date, gender, address, notes, source, status)
values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Maria Silva Santos', '12345678901', 'maria.silva@email.com', '(71) 98888-0001', '1985-03-15', 'F',
   'Rua das Flores, 45 - Barra, Salvador', 'Paciente desde 2024. Alergia a dipirona.', 'INDICACAO', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'João Pedro Oliveira', '23456789012', 'joao.pedro@email.com', '(71) 98888-0002', '1990-07-22', 'M',
   'Av. Tancredo Neves, 1200 - Caminho das Árvores', null, 'GOOGLE', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'Ana Carolina Ferreira', '34567890123', 'ana.ferreira@email.com', '(71) 98888-0003', '1978-11-08', 'F',
   'Rua Ewerton Visco, 88 - Caminho das Árvores', 'Diabética tipo 2. Acompanhamento nutricional.', 'WHATSAPP', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'Lucas Gabriel Costa', '45678901234', null, '(71) 98888-0004', '1995-01-30', 'M',
   null, null, 'INSTAGRAM', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'Beatriz Souza Lima', '56789012345', 'bia.lima@email.com', '(71) 98888-0005', '2000-06-12', 'F',
   'Rua da Graça, 300 - Graça', 'Tratamento de acne. Sessões mensais de peeling.', 'INDICACAO', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'Rafael Mendes Junior', '67890123456', 'rafael.mj@email.com', '(71) 98888-0006', '1982-09-05', 'M',
   'Av. Paulo VI, 500 - Pituba', null, 'GOOGLE', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001',
   'Camila Rodrigues Alves', '78901234567', null, '(71) 98888-0007', '1992-12-18', 'F',
   null, 'Gestante - 7 meses. Acompanhamento nutricional semanal.', 'WHATSAPP', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001',
   'Pedro Henrique Nascimento', '89012345678', 'pedro.hn@email.com', '(71) 98888-0008', '1975-04-25', 'M',
   'Rua Marquês de Caravelas, 72 - Amaralina', 'Hipertenso. Medicação contínua.', 'INDICACAO', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001',
   'Larissa Campos Dias', '90123456789', 'larissa.cd@email.com', '(71) 98888-0009', '1998-08-14', 'F',
   null, null, 'WEBSITE', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001',
   'Fernando Augusto Reis', '01234567890', null, '(71) 98888-0010', '1988-02-28', 'M',
   'Rua Visconde de Itaboaraí, 15 - Rio Vermelho', null, 'OUTRO', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001',
   'Juliana Martins Pereira', '11234567890', 'ju.martins@email.com', '(71) 98888-0011', '1993-05-20', 'F',
   null, 'Primeira consulta em jan/2026.', 'INSTAGRAM', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001',
   'Thiago Barbosa Luz', '12234567890', null, '(71) 98888-0012', '1980-10-03', 'M',
   null, null, 'GOOGLE', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001',
   'Isabela Freitas Santos', '13234567890', 'isa.freitas@email.com', '(71) 98888-0013', '2001-01-07', 'F',
   'Rua Amazonas, 220 - Pituba', null, 'INDICACAO', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001',
   'Roberto Carlos Neto', '14234567890', null, '(71) 98888-0014', '1970-06-30', 'M',
   null, 'Paciente idoso. Mobilidade reduzida.', 'WHATSAPP', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001',
   'Patrícia Gomes Rocha', '15234567890', 'patricia.gr@email.com', '(71) 98888-0015', '1987-11-11', 'F',
   null, null, 'WEBSITE', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001',
   'André Luiz Teixeira', '16234567890', null, '(71) 98888-0016', '1996-03-08', 'M',
   null, null, 'INSTAGRAM', 'INACTIVE'),
  ('d0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001',
   'Vanessa Ribeiro Motta', '17234567890', 'vanessa.rm@email.com', '(71) 98888-0017', '1984-07-19', 'F',
   null, 'Cancelou tratamento em dez/2025.', 'INDICACAO', 'INACTIVE'),
  ('d0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001',
   'Diego Santos Cardoso', '18234567890', null, '(71) 98888-0018', '1991-09-25', 'M',
   null, null, 'GOOGLE', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001',
   'Renata Almeida Pinto', '19234567890', 'renata.ap@email.com', '(71) 98888-0019', '1999-04-02', 'F',
   null, 'Acompanhamento nutricional para ganho de massa.', 'WHATSAPP', 'ACTIVE'),
  ('d0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001',
   'Marcos Vinícius Araujo', '20234567890', null, '(71) 98888-0020', '1976-12-14', 'M',
   'Rua Conselheiro Pedro Luiz, 55 - Rio Vermelho', null, 'OUTRO', 'ACTIVE');

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. LEADS (8)
-- ══════════════════════════════════════════════════════════════════════════════

insert into leads (clinic_id, full_name, phone, email, source, status, notes)
values
  ('a0000000-0000-0000-0000-000000000001', 'Priscila Viana', '(71) 97777-0001', 'priscila.v@email.com', 'INSTAGRAM', 'NEW', 'Perguntou sobre preço de peeling no Instagram'),
  ('a0000000-0000-0000-0000-000000000001', 'Roberto Fonseca', '(71) 97777-0002', null, 'WHATSAPP', 'NEW', 'Mandou mensagem no WhatsApp perguntando horários'),
  ('a0000000-0000-0000-0000-000000000001', 'Carla Medeiros', '(71) 97777-0003', 'carla.m@email.com', 'WEBSITE', 'CONTACTED', 'Preencheu formulário do site. Retornar ligação.'),
  ('a0000000-0000-0000-0000-000000000001', 'Eduardo Lopes', '(71) 97777-0004', null, 'GOOGLE', 'CONTACTED', 'Encontrou no Google Maps. Quer agendar avaliação.'),
  ('a0000000-0000-0000-0000-000000000001', 'Sabrina Castro', '(71) 97777-0005', 'sabrina.c@email.com', 'INDICACAO', 'QUALIFIED', 'Indicada pela Maria Silva. Interesse em dermatologia.'),
  ('a0000000-0000-0000-0000-000000000001', 'Henrique Dias', '(71) 97777-0006', null, 'WHATSAPP', 'QUALIFIED', 'Quer iniciar acompanhamento nutricional. Budget OK.'),
  ('a0000000-0000-0000-0000-000000000001', 'Amanda Rocha', '(71) 97777-0007', 'amanda.r@email.com', 'INSTAGRAM', 'CONVERTED', 'Convertida em paciente em fev/2026.'),
  ('a0000000-0000-0000-0000-000000000001', 'Vitor Campos', '(71) 97777-0008', null, 'GOOGLE', 'LOST', 'Achou caro. Optou por outra clínica.');

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. AGENDAMENTOS
-- ══════════════════════════════════════════════════════════════════════════════

-- Função auxiliar para calcular datas relativas
-- Usamos CURRENT_DATE para que os dados fiquem sempre relativos a "hoje"

-- Agendamentos passados (concluídos)
insert into appointments (id, clinic_id, patient_id, professional_id, service_id, starts_at, ends_at, status, notes, confirmed_at)
values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   (CURRENT_DATE - interval '7 days') + time '09:00', (CURRENT_DATE - interval '7 days') + time '09:30',
   'COMPLETED', 'Avaliação dermatológica inicial. Prescrito tratamento para melasma.', (CURRENT_DATE - interval '8 days')::timestamptz),

  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003',
   (CURRENT_DATE - interval '5 days') + time '10:00', (CURRENT_DATE - interval '5 days') + time '11:00',
   'COMPLETED', 'Reavaliação nutricional. Ajuste no plano alimentar.', (CURRENT_DATE - interval '6 days')::timestamptz),

  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   (CURRENT_DATE - interval '3 days') + time '14:00', (CURRENT_DATE - interval '3 days') + time '14:45',
   'COMPLETED', 'Check-up anual. Solicitou exames de sangue.', (CURRENT_DATE - interval '4 days')::timestamptz),

  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   (CURRENT_DATE - interval '2 days') + time '11:00', (CURRENT_DATE - interval '2 days') + time '11:45',
   'COMPLETED', 'Peeling químico sessão 3/6.', (CURRENT_DATE - interval '3 days')::timestamptz),

-- No-show de ontem
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   (CURRENT_DATE - interval '1 day') + time '09:00', (CURRENT_DATE - interval '1 day') + time '09:45',
   'NO_SHOW', null, (CURRENT_DATE - interval '2 days')::timestamptz),

-- Consulta de ontem confirmada mas não concluída (pendência no dashboard)
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   (CURRENT_DATE - interval '1 day') + time '15:00', (CURRENT_DATE - interval '1 day') + time '15:45',
   'CONFIRMED', 'Retorno para ver exames.', (CURRENT_DATE - interval '2 days')::timestamptz),

-- HOJE: 5 agendamentos em diferentes status
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',
   CURRENT_DATE + time '09:00', CURRENT_DATE + time '09:20',
   'CONFIRMED', 'Retorno dermatológico - avaliação melasma.', (CURRENT_DATE - interval '1 day')::timestamptz),

  ('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   CURRENT_DATE + time '10:00', CURRENT_DATE + time '10:45',
   'SCHEDULED', 'Primeira consulta. Queixa de dor lombar.', null),

  ('e0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003',
   CURRENT_DATE + time '11:00', CURRENT_DATE + time '12:00',
   'SCHEDULED', 'Acompanhamento gestacional - 7 meses.', null),

  ('e0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   CURRENT_DATE + time '14:00', CURRENT_DATE + time '14:30',
   'CONFIRMED', 'Avaliação de manchas no rosto.', (CURRENT_DATE - interval '2 days')::timestamptz),

  ('e0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   CURRENT_DATE + time '16:00', CURRENT_DATE + time '16:45',
   'SCHEDULED', null, null),

-- FUTUROS (próximos dias)
  ('e0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   (CURRENT_DATE + interval '1 day') + time '09:30', (CURRENT_DATE + interval '1 day') + time '10:15',
   'CONFIRMED', 'Peeling químico - primeira sessão.', CURRENT_DATE::timestamptz),

  ('e0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006',
   (CURRENT_DATE + interval '2 days') + time '10:00', (CURRENT_DATE + interval '2 days') + time '10:30',
   'SCHEDULED', 'Bioimpedância + consulta nutricional inicial.', null),

  ('e0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003',
   (CURRENT_DATE + interval '3 days') + time '14:00', (CURRENT_DATE + interval '3 days') + time '15:00',
   'SCHEDULED', 'Retorno nutricional mensal.', null),

  ('e0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   (CURRENT_DATE + interval '5 days') + time '11:00', (CURRENT_DATE + interval '5 days') + time '11:45',
   'SCHEDULED', 'Consulta geral. Paciente idoso, precisa de mais tempo.', null),

-- Cancelado
  ('e0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   (CURRENT_DATE + interval '1 day') + time '14:00', (CURRENT_DATE + interval '1 day') + time '14:30',
   'CANCELLED', 'Paciente cancelou por motivo pessoal.', null);

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. HISTÓRICO DE STATUS (para consultas passadas)
-- ══════════════════════════════════════════════════════════════════════════════

-- ⚠️ SUBSTITUA __USER_ID__
insert into appointment_status_history (appointment_id, clinic_id, from_status, to_status, changed_by, reason)
values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', null, 'SCHEDULED', '__USER_ID__', null),
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'SCHEDULED', 'CONFIRMED', '__USER_ID__', null),
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'CONFIRMED', 'IN_PROGRESS', '__USER_ID__', null),
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'IN_PROGRESS', 'COMPLETED', '__USER_ID__', null),

  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', null, 'SCHEDULED', '__USER_ID__', null),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'SCHEDULED', 'CONFIRMED', '__USER_ID__', null),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'CONFIRMED', 'NO_SHOW', '__USER_ID__', 'Paciente não compareceu e não avisou.'),

  ('e0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', null, 'SCHEDULED', '__USER_ID__', null),
  ('e0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'SCHEDULED', 'CANCELLED', '__USER_ID__', 'Paciente cancelou por motivo pessoal.');

-- ══════════════════════════════════════════════════════════════════════════════
-- 10. FOLLOW-UPS
-- ══════════════════════════════════════════════════════════════════════════════

insert into follow_ups (clinic_id, patient_id, appointment_id, scheduled_for, status, notes)
values
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
   CURRENT_DATE, 'PENDING', 'Retorno para avaliar tratamento de melasma. Ligar para confirmar.'),
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002',
   CURRENT_DATE + interval '2 days', 'PENDING', 'Verificar adesão ao novo plano alimentar.'),
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000005',
   CURRENT_DATE, 'PENDING', 'Paciente faltou ontem. Ligar para reagendar.'),
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000004',
   (CURRENT_DATE - interval '1 day')::date, 'DONE', 'Paciente confirmou próxima sessão de peeling.');

-- ══════════════════════════════════════════════════════════════════════════════
-- PRONTO!
-- ══════════════════════════════════════════════════════════════════════════════
-- Dashboard deve mostrar:
--   5 consultas hoje (2 SCHEDULED, 2 CONFIRMED, 1 SCHEDULED tarde)
--   3 pendências (2 sem confirmar hoje + 1 no-show de ontem + 2 follow-ups)
--   18 pacientes ativos, 2 inativos
--   2 leads novos, 2 contactados, 2 qualificados, 1 convertido, 1 perdido
--   3 profissionais com horários configurados
--   6 serviços ativos
-- ══════════════════════════════════════════════════════════════════════════════
