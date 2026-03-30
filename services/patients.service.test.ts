import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseMock, createQueryChain } from '@/tests/mocks/supabase';
import { createPatient, searchPatients, deletePatient } from './patients.service';

vi.mock('@/lib/supabase/server');

// Mocks de dependências dinâmicas
vi.mock('@/services/plan-limits.service', () => ({
  enforcePlanLimit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/services/audit.service', () => ({
  logAction: vi.fn().mockResolvedValue(undefined),
}));

const CLINIC_ID  = 'b2c3d479-58cc-4372-a567-f47ac10b0000';
const USER_ID    = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const PATIENT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const fakePatient = {
  id: PATIENT_ID,
  clinic_id: CLINIC_ID,
  full_name: 'João da Silva',
  cpf: '12345678901',
  cpf_encrypted: null,
  email: 'joao@example.com',
  phone: '11999990000',
  birth_date: null,
  gender: null,
  address: null,
  notes: null,
  source: 'WEBSITE',
  status: 'ACTIVE',
  created_by: USER_ID,
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
  deleted_at: null,
};

// ── createPatient ─────────────────────────────────────────────────────────────

describe('createPatient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseInput = {
    clinic_id: CLINIC_ID,
    full_name: 'João da Silva',
    cpf: '12345678901',
    email: 'joao@example.com',
  };

  function setupMock(patientResult = fakePatient) {
    const { client, chain } = createSupabaseMock({ data: null, error: null });
    // rpc crm_encrypt retorna null (chave não configurada — graceful fail)
    client.rpc.mockResolvedValue({ data: null, error: null });
    // insert.select.single → retorna paciente
    chain.single.mockResolvedValue({ data: patientResult, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);
    return { client, chain };
  }

  it('cria paciente com dados válidos', async () => {
    setupMock();
    const result = await createPatient(baseInput, USER_ID);
    expect(result.full_name).toBe('João da Silva');
    expect(result.id).toBe(PATIENT_ID);
  });

  it('lança erro se full_name está vazio', async () => {
    await expect(
      createPatient({ ...baseInput, full_name: '' }, USER_ID)
    ).rejects.toThrow('nome completo');
  });

  it('lança erro se full_name tem menos de 2 caracteres', async () => {
    await expect(
      createPatient({ ...baseInput, full_name: 'A' }, USER_ID)
    ).rejects.toThrow('2 caracteres');
  });

  it('lança erro se clinic_id está vazio', async () => {
    await expect(
      createPatient({ ...baseInput, clinic_id: '' }, USER_ID)
    ).rejects.toThrow('Clínica não identificada');
  });

  it('lança erro se email tem formato inválido', async () => {
    await expect(
      createPatient({ ...baseInput, email: 'nao-eh-email' }, USER_ID)
    ).rejects.toThrow('Email');
  });

  it('aceita email null (campo opcional)', async () => {
    setupMock();
    await expect(
      createPatient({ ...baseInput, email: null }, USER_ID)
    ).resolves.not.toThrow();
  });

  it('normaliza CPF removendo não-dígitos', async () => {
    const { client, chain } = createSupabaseMock({ data: null, error: null });
    client.rpc.mockResolvedValue({ data: null, error: null });
    chain.single.mockResolvedValue({ data: fakePatient, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await createPatient({ ...baseInput, cpf: '123.456.789-01' }, USER_ID);

    // Verifica que o insert foi chamado com CPF normalizado (só dígitos)
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ cpf: '12345678901' })
    );
  });

  it('lança erro de CPF duplicado (código 23505)', async () => {
    const { client, chain } = createSupabaseMock({ data: null, error: null });
    client.rpc.mockResolvedValue({ data: null, error: null });
    chain.single.mockResolvedValue({ data: null, error: { message: 'unique', code: '23505' } });
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      createPatient(baseInput, USER_ID)
    ).rejects.toThrow('CPF');
  });

  it('chama enforcePlanLimit antes de inserir', async () => {
    const { enforcePlanLimit } = await import('@/services/plan-limits.service');
    setupMock();

    await createPatient(baseInput, USER_ID);
    expect(enforcePlanLimit).toHaveBeenCalledWith(CLINIC_ID, 'patients');
  });
});

// ── searchPatients ────────────────────────────────────────────────────────────

describe('searchPatients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca por string alfanumérica usa full_name/email/cpf/phone', async () => {
    const { client, chain } = createSupabaseMock({ data: [fakePatient], error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await searchPatients(CLINIC_ID, 'João');
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('full_name'));
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('email'));
  });

  it('busca por string só dígitos usa cpf/phone', async () => {
    const { client, chain } = createSupabaseMock({ data: [fakePatient], error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await searchPatients(CLINIC_ID, '11999990000');
    // query is digits-only: should NOT search by full_name/email
    const orCall = chain.or.mock.calls[0][0] as string;
    expect(orCall).not.toContain('full_name');
    expect(orCall).toContain('phone');
  });

  it('retorna todos os pacientes com query vazia', async () => {
    const { client } = createSupabaseMock({ data: [fakePatient], error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    const result = await searchPatients(CLINIC_ID, '');
    expect(result).toHaveLength(1);
  });
});

// ── deletePatient ─────────────────────────────────────────────────────────────

describe('deletePatient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bloqueia exclusão se há agendamentos futuros', async () => {
    // Primeiro from: getPatientById → retorna paciente
    const getChain = createQueryChain({ data: fakePatient, error: null });
    // Segundo from: verifica agendamentos → retorna 1 agendamento futuro
    const apptChain = createQueryChain({ data: [{ id: 'appt-1' }], error: null });

    const { client } = createSupabaseMock();
    client.from
      .mockReturnValueOnce(getChain)  // getPatientById
      .mockReturnValueOnce(apptChain); // check appointments
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      deletePatient(PATIENT_ID, CLINIC_ID, USER_ID)
    ).rejects.toThrow('agendamentos futuros');
  });

  it('faz soft delete (update deleted_at) quando não há agendamentos', async () => {
    // getPatientById → retorna paciente
    const getChain = createQueryChain({ data: fakePatient, error: null });
    // check appointments → vazio
    const apptChain = createQueryChain({ data: [], error: null });
    // soft delete update
    const deleteChain = createQueryChain({ data: null, error: null });

    const { client } = createSupabaseMock();
    client.from
      .mockReturnValueOnce(getChain)
      .mockReturnValueOnce(apptChain)
      .mockReturnValueOnce(deleteChain);
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      deletePatient(PATIENT_ID, CLINIC_ID, USER_ID)
    ).resolves.toBeUndefined();

    // Soft delete: deve chamar update, não delete
    expect(deleteChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    );
    expect(deleteChain.delete).not.toHaveBeenCalled();
  });

  it('lança erro se paciente não pertence à clínica', async () => {
    const getChain = createQueryChain({ data: null, error: null });

    const { client } = createSupabaseMock();
    client.from.mockReturnValueOnce(getChain);
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      deletePatient(PATIENT_ID, CLINIC_ID, USER_ID)
    ).rejects.toThrow('não encontrado');
  });
});
