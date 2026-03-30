-- ============================================================================
-- Migration 013: Índices compostos para performance de dashboard e relatórios
-- ============================================================================

-- ── 1. Appointments ───────────────────────────────────────────────────────────

-- Dashboard: agendamentos de hoje por clínica (query mais frequente)
create index if not exists idx_appointments_clinic_date
  on appointments(clinic_id, starts_at)
  where deleted_at is null;

-- Por profissional e data (agenda individual)
create index if not exists idx_appointments_professional_date
  on appointments(professional_id, starts_at)
  where deleted_at is null and professional_id is not null;

-- ── 2. Leads ─────────────────────────────────────────────────────────────────

-- Dashboard: métricas de leads por clínica, status e data de criação
create index if not exists idx_leads_clinic_status_created
  on leads(clinic_id, status, created_at desc)
  where deleted_at is null;

-- ── 3. Pagamentos ─────────────────────────────────────────────────────────────

-- Financeiro: pagamentos por período e status
create index if not exists idx_payments_clinic_status_date
  on payments(clinic_id, status, paid_at desc)
  where deleted_at is null;

-- ── 4. Pacientes ─────────────────────────────────────────────────────────────

-- Busca por nome (case-insensitive)
create index if not exists idx_patients_clinic_name
  on patients(clinic_id, lower(full_name))
  where deleted_at is null;

-- ── 5. Follow-ups ─────────────────────────────────────────────────────────────

-- Follow-ups pendentes (usada no widget de ações pendentes do dashboard)
create index if not exists idx_follow_ups_clinic_pending
  on follow_ups(clinic_id, scheduled_for)
  where status = 'PENDING';

-- ── 6. Audit logs ─────────────────────────────────────────────────────────────

-- Busca por clínica e data (relatórios de auditoria)
create index if not exists idx_audit_logs_clinic_date
  on audit_logs(clinic_id, created_at desc)
  where clinic_id is not null;

-- ── 7. Subscriptions ──────────────────────────────────────────────────────────

-- Verificação rápida de status do plano (chamada no middleware em cada request)
create index if not exists idx_subscriptions_clinic_status
  on subscriptions(clinic_id, status);

-- ── 8. View materializada: mv_dashboard_metrics ───────────────────────────────
-- Agrega métricas de dashboard por clínica.
-- IMPORTANTE: Em desenvolvimento, a view precisa de refresh manual:
--   refresh materialized view concurrently mv_dashboard_metrics;
-- Em produção, configure pg_cron conforme instruções no final deste arquivo.

create materialized view if not exists mv_dashboard_metrics as
select
  c.id as clinic_id,

  -- Agendamentos de hoje
  count(a.id) filter (
    where a.starts_at::date = current_date
      and a.deleted_at is null
  ) as appointments_today,

  -- Confirmados hoje
  count(a.id) filter (
    where a.starts_at::date = current_date
      and a.status = 'CONFIRMED'
      and a.deleted_at is null
  ) as confirmed_today,

  -- Pacientes ativos
  count(distinct p.id) filter (
    where p.status = 'ACTIVE'
      and p.deleted_at is null
  ) as active_patients,

  -- Leads dos últimos 30 dias
  count(l.id) filter (
    where l.created_at >= now() - interval '30 days'
      and l.deleted_at is null
  ) as leads_last_30d,

  -- Receita do mês corrente (pagamentos com status PAID)
  coalesce(sum(pay.amount) filter (
    where pay.status = 'PAID'
      and date_trunc('month', pay.paid_at) = date_trunc('month', now())
      and pay.deleted_at is null
  ), 0) as revenue_month

from clinics c
left join appointments a   on a.clinic_id   = c.id
left join patients p       on p.clinic_id   = c.id
left join leads l          on l.clinic_id   = c.id
left join payments pay     on pay.clinic_id = c.id
where c.deleted_at is null
group by c.id;

-- Índice único na view para suportar REFRESH CONCURRENTLY
create unique index if not exists idx_mv_dashboard_metrics_clinic
  on mv_dashboard_metrics(clinic_id);

-- ── pg_cron: refresh automático a cada 15 minutos ────────────────────────────
-- Descomente após habilitar a extensão pg_cron no painel Supabase:
-- (Dashboard → Database → Extensions → pg_cron)
--
-- select cron.schedule(
--   'refresh-dashboard-metrics',
--   '*/15 * * * *',
--   'refresh materialized view concurrently mv_dashboard_metrics'
-- );
