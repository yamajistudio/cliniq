import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseMock, createQueryChain } from '@/tests/mocks/supabase';
import {
  changeAppointmentStatus,
  createAppointment,
  listAppointmentsByWeek,
  getWeekDates,
  getMonday,
} from './appointments.service';

vi.mock('@/lib/supabase/server');
vi.mock('@/services/plan-limits.service', () => ({
  enforcePlanLimit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/services/appointment-history.service', () => ({
  logStatusTransition: vi.fn().mockResolvedValue(undefined),
}));

const CLINIC_ID = 'b2c3d479-58cc-4372-a567-f47ac10b0000';
const USER_ID   = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const APPT_ID   = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const PATIENT_ID = 'c0a80100-0000-4000-a000-000000000001';

function makeAppt(status: string) {
  return {
    id: APPT_ID,
    clinic_id: CLINIC_ID,
    patient_id: PATIENT_ID,
    professional_id: null,
    doctor_id: null,
    service_id: null,
    starts_at: '2026-03-29T09:00:00Z',
    ends_at: null,
    status,
    notes: null,
    created_by: USER_ID,
    created_at: '2026-03-29T08:00:00Z',
    updated_at: '2026-03-29T08:00:00Z',
    deleted_at: null,
  };
}

// ── changeAppointmentStatus ───────────────────────────────────────────────────

describe('changeAppointmentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupForStatus(currentStatus: string, nextStatus: string) {
    const getChain  = createQueryChain({ data: makeAppt(currentStatus), error: null });
    const updChain  = createQueryChain({ data: null, error: null });
    updChain.single.mockResolvedValue({ data: makeAppt(nextStatus), error: null });

    const { client } = createSupabaseMock();
    client.from
      .mockReturnValueOnce(getChain)  // getAppointmentById
      .mockReturnValueOnce(updChain); // update
    vi.mocked(createClient).mockReturnValue(client as any);
    return { updChain };
  }

  // Transições válidas (conforme APPOINTMENT_FLOW)
  it('SCHEDULED → CONFIRMED é válido', async () => {
    setupForStatus('SCHEDULED', 'CONFIRMED');
    const result = await changeAppointmentStatus(APPT_ID, CLINIC_ID, 'CONFIRMED', USER_ID);
    expect(result.status).toBe('CONFIRMED');
  });

  it('CONFIRMED → IN_PROGRESS é válido', async () => {
    setupForStatus('CONFIRMED', 'IN_PROGRESS');
    const result = await changeAppointmentStatus(APPT_ID, CLINIC_ID, 'IN_PROGRESS', USER_ID);
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('IN_PROGRESS → COMPLETED é válido', async () => {
    setupForStatus('IN_PROGRESS', 'COMPLETED');
    const result = await changeAppointmentStatus(APPT_ID, CLINIC_ID, 'COMPLETED', USER_ID);
    expect(result.status).toBe('COMPLETED');
  });

  it('CANCELLED → SCHEDULED é válido (reagendar)', async () => {
    setupForStatus('CANCELLED', 'SCHEDULED');
    const result = await changeAppointmentStatus(APPT_ID, CLINIC_ID, 'SCHEDULED', USER_ID);
    expect(result.status).toBe('SCHEDULED');
  });

  // Transições inválidas
  it('rejeita COMPLETED → CONFIRMED', async () => {
    const getChain = createQueryChain({ data: makeAppt('COMPLETED'), error: null });
    const { client } = createSupabaseMock();
    client.from.mockReturnValueOnce(getChain);
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      changeAppointmentStatus(APPT_ID, CLINIC_ID, 'CONFIRMED', USER_ID)
    ).rejects.toThrow('Não é possível mudar');
  });

  it('rejeita SCHEDULED → COMPLETED (pula etapas)', async () => {
    const getChain = createQueryChain({ data: makeAppt('SCHEDULED'), error: null });
    const { client } = createSupabaseMock();
    client.from.mockReturnValueOnce(getChain);
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      changeAppointmentStatus(APPT_ID, CLINIC_ID, 'COMPLETED', USER_ID)
    ).rejects.toThrow('Não é possível mudar');
  });

  it('lança erro se agendamento não é encontrado', async () => {
    const getChain = createQueryChain({ data: null, error: null });
    const { client } = createSupabaseMock();
    client.from.mockReturnValueOnce(getChain);
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      changeAppointmentStatus(APPT_ID, CLINIC_ID, 'CONFIRMED', USER_ID)
    ).rejects.toThrow('não encontrado');
  });

  it('registra histórico de status após transição válida', async () => {
    const { logStatusTransition } = await import('@/services/appointment-history.service');
    setupForStatus('SCHEDULED', 'CONFIRMED');

    await changeAppointmentStatus(APPT_ID, CLINIC_ID, 'CONFIRMED', USER_ID);
    expect(logStatusTransition).toHaveBeenCalledWith(
      APPT_ID, CLINIC_ID, 'SCHEDULED', 'CONFIRMED', USER_ID, undefined
    );
  });
});

// ── createAppointment ─────────────────────────────────────────────────────────

describe('createAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput = {
    clinic_id: CLINIC_ID,
    patient_id: PATIENT_ID,
    starts_at: '2026-04-01T09:00:00',
  };

  it('cria agendamento com dados válidos', async () => {
    const { client, chain } = createSupabaseMock();
    chain.single.mockResolvedValue({ data: makeAppt('SCHEDULED'), error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    const result = await createAppointment(validInput, USER_ID);
    expect(result.status).toBe('SCHEDULED');
  });

  it('lança erro se clinic_id está vazio', async () => {
    await expect(
      createAppointment({ ...validInput, clinic_id: '' }, USER_ID)
    ).rejects.toThrow('Clínica não identificada');
  });

  it('lança erro se patient_id está vazio', async () => {
    await expect(
      createAppointment({ ...validInput, patient_id: '' }, USER_ID)
    ).rejects.toThrow('Selecione o paciente');
  });

  it('lança erro se starts_at está vazio', async () => {
    await expect(
      createAppointment({ ...validInput, starts_at: '' }, USER_ID)
    ).rejects.toThrow('data e hora');
  });

  it('chama enforcePlanLimit com appointments_month', async () => {
    const { enforcePlanLimit } = await import('@/services/plan-limits.service');
    const { client, chain } = createSupabaseMock();
    chain.single.mockResolvedValue({ data: makeAppt('SCHEDULED'), error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await createAppointment(validInput, USER_ID);
    expect(enforcePlanLimit).toHaveBeenCalledWith(CLINIC_ID, 'appointments_month');
  });

  it('bloqueia se limite do plano é atingido', async () => {
    const { enforcePlanLimit } = await import('@/services/plan-limits.service');
    vi.mocked(enforcePlanLimit).mockRejectedValueOnce(
      new Error('Limite de agendamentos atingido')
    );

    await expect(
      createAppointment(validInput, USER_ID)
    ).rejects.toThrow('Limite de agendamentos');
  });
});

// ── listAppointmentsByWeek ────────────────────────────────────────────────────

describe('listAppointmentsByWeek', () => {
  it('retorna agendamentos da semana', async () => {
    const appts = [makeAppt('SCHEDULED'), makeAppt('CONFIRMED')];
    const { client } = createSupabaseMock({ data: appts, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    const result = await listAppointmentsByWeek(CLINIC_ID, '2026-03-23');
    expect(result).toHaveLength(2);
  });

  it('filtra por professional_id quando fornecido', async () => {
    const { client, chain } = createSupabaseMock({ data: [], error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    const PROF_ID = 'c0a80100-0000-4000-a000-000000000002';
    await listAppointmentsByWeek(CLINIC_ID, '2026-03-23', PROF_ID);
    expect(chain.eq).toHaveBeenCalledWith('professional_id', PROF_ID);
  });

  it('não filtra por professional_id quando null', async () => {
    const { client, chain } = createSupabaseMock({ data: [], error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await listAppointmentsByWeek(CLINIC_ID, '2026-03-23', null);
    const eqCalls = chain.eq.mock.calls as [string, string][];
    const hasProf = eqCalls.some(([col]) => col === 'professional_id');
    expect(hasProf).toBe(false);
  });
});

// ── Funções puras: getWeekDates e getMonday ───────────────────────────────────

describe('getWeekDates', () => {
  it('retorna 7 datas consecutivas', () => {
    const dates = getWeekDates('2026-03-23');
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe('2026-03-23');
    expect(dates[6]).toBe('2026-03-29');
  });
});

describe('getMonday', () => {
  it('retorna segunda-feira da semana de uma quarta', () => {
    // 2026-03-25 é quarta-feira; segunda é 2026-03-23
    expect(getMonday('2026-03-25')).toBe('2026-03-23');
  });

  it('retorna a própria data se já é segunda-feira', () => {
    expect(getMonday('2026-03-23')).toBe('2026-03-23');
  });

  it('domingo retorna a segunda da semana anterior (comportamento ISO)', () => {
    // getMonday usa diff = -6 para domingo: 2026-03-22 (dom) → 2026-03-16 (seg anterior)
    // Isso é o comportamento da função — domingo encerra a semana anterior
    expect(getMonday('2026-03-22')).toBe('2026-03-16');
  });
});
