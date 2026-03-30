import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseMock, createQueryChain } from '@/tests/mocks/supabase';
import {
  listLeads,
  createLead,
  updateLead,
  convertLeadToPatient,
} from './leads.service';

vi.mock('@/lib/supabase/server');

const CLINIC_ID = 'b2c3d479-58cc-4372-a567-f47ac10b0000';
const USER_ID   = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const LEAD_ID   = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const fakeLead = {
  id: LEAD_ID,
  clinic_id: CLINIC_ID,
  full_name: 'Maria Oliveira',
  phone: '11999999999',
  email: null,
  source: 'WHATSAPP',
  status: 'NEW',
  notes: null,
  assigned_to: null,
  converted_patient_id: null,
  created_by: USER_ID,
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
  deleted_at: null,
};

// ── listLeads ─────────────────────────────────────────────────────────────────

describe('listLeads', () => {
  it('retorna array de leads da clínica', async () => {
    const { client } = createSupabaseMock({ data: [fakeLead], error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    const result = await listLeads(CLINIC_ID);
    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('Maria Oliveira');
  });

  it('filtra por clinic_id', async () => {
    const { client, chain } = createSupabaseMock({ data: [], error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await listLeads(CLINIC_ID);
    expect(chain.eq).toHaveBeenCalledWith('clinic_id', CLINIC_ID);
  });

  it('ordena por created_at desc', async () => {
    const { client, chain } = createSupabaseMock({ data: [], error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await listLeads(CLINIC_ID);
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('retorna array vazio se clinic_id vazio', async () => {
    const result = await listLeads('');
    expect(result).toEqual([]);
  });

  it('lança erro se Supabase retorna erro', async () => {
    const { client } = createSupabaseMock({ data: null, error: { message: 'DB error' } });
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(listLeads(CLINIC_ID)).rejects.toThrow('Falha ao listar leads');
  });
});

// ── createLead ────────────────────────────────────────────────────────────────

describe('createLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria lead com dados válidos', async () => {
    const { client, chain } = createSupabaseMock({ data: null, error: null });
    chain.single.mockResolvedValue({ data: fakeLead, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    const result = await createLead(
      { clinic_id: CLINIC_ID, full_name: 'Maria Oliveira', source: 'WHATSAPP' },
      USER_ID
    );
    expect(result.full_name).toBe('Maria Oliveira');
  });

  it('lança erro se full_name está vazio', async () => {
    await expect(
      createLead({ clinic_id: CLINIC_ID, full_name: '', source: 'WHATSAPP' }, USER_ID)
    ).rejects.toThrow('nome do lead');
  });

  it('lança erro se full_name é só espaços', async () => {
    await expect(
      createLead({ clinic_id: CLINIC_ID, full_name: '   ', source: 'WHATSAPP' }, USER_ID)
    ).rejects.toThrow('nome do lead');
  });

  it('lança erro se clinic_id está vazio', async () => {
    await expect(
      createLead({ clinic_id: '', full_name: 'João', source: 'WHATSAPP' }, USER_ID)
    ).rejects.toThrow('Clínica não identificada');
  });

  it('lança erro se Supabase retorna erro no insert', async () => {
    const { client, chain } = createSupabaseMock({ data: null, error: null });
    chain.single.mockResolvedValue({ data: null, error: { message: 'unique violation' } });
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      createLead({ clinic_id: CLINIC_ID, full_name: 'João', source: 'OUTRO' }, USER_ID)
    ).rejects.toThrow('Falha ao cadastrar lead');
  });
});

// ── updateLead ────────────────────────────────────────────────────────────────

describe('updateLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('atualiza apenas os campos informados', async () => {
    const { client, chain } = createSupabaseMock({ data: null, error: null });
    chain.single.mockResolvedValue({ data: { ...fakeLead, status: 'CONTACTED' }, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    const result = await updateLead(LEAD_ID, CLINIC_ID, { status: 'CONTACTED' });
    expect(result.status).toBe('CONTACTED');
  });

  it('filtra update por clinic_id (prevenção cross-tenant)', async () => {
    const { client, chain } = createSupabaseMock({ data: null, error: null });
    chain.single.mockResolvedValue({ data: fakeLead, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await updateLead(LEAD_ID, CLINIC_ID, { notes: 'teste' });

    // Verifica que o update usa clinic_id como filtro
    expect(chain.eq).toHaveBeenCalledWith('clinic_id', CLINIC_ID);
  });

  it('lança erro se Supabase retorna erro', async () => {
    const { client, chain } = createSupabaseMock({ data: null, error: null });
    chain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      updateLead(LEAD_ID, CLINIC_ID, { status: 'LOST' })
    ).rejects.toThrow('Falha ao atualizar lead');
  });
});

// ── convertLeadToPatient ──────────────────────────────────────────────────────

describe('convertLeadToPatient', () => {
  const PATIENT_ID = 'c0a80100-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna patientId em conversão bem-sucedida', async () => {
    const { client } = createSupabaseMock();
    client.functions.invoke.mockResolvedValue({ data: { patientId: PATIENT_ID }, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    const result = await convertLeadToPatient(LEAD_ID, CLINIC_ID, USER_ID);
    expect(result.patientId).toBe(PATIENT_ID);
  });

  it('invoca a Edge Function correta com leadId e clinicId', async () => {
    const { client } = createSupabaseMock();
    client.functions.invoke.mockResolvedValue({ data: { patientId: PATIENT_ID }, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await convertLeadToPatient(LEAD_ID, CLINIC_ID, USER_ID);
    expect(client.functions.invoke).toHaveBeenCalledWith(
      'convert-lead-to-patient',
      { body: { leadId: LEAD_ID, clinicId: CLINIC_ID } }
    );
  });

  it('lança erro se a Edge Function retorna erro', async () => {
    const { client } = createSupabaseMock();
    client.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Lead já convertido' },
    });
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      convertLeadToPatient(LEAD_ID, CLINIC_ID, USER_ID)
    ).rejects.toThrow('Falha ao converter lead em paciente');
  });

  it('lança erro se patientId não é retornado', async () => {
    const { client } = createSupabaseMock();
    client.functions.invoke.mockResolvedValue({ data: {}, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);

    await expect(
      convertLeadToPatient(LEAD_ID, CLINIC_ID, USER_ID)
    ).rejects.toThrow('ID do paciente não retornado');
  });
});
