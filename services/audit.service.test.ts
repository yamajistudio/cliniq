import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseMock } from '@/tests/mocks/supabase';
import { logAction } from './audit.service';

vi.mock('@/lib/supabase/server');

const VALID_ENTITY_ID  = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const VALID_ACTOR_ID   = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const VALID_CLINIC_ID  = 'b2c3d479-58cc-4372-a567-f47ac10b0000';

describe('logAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: insert succeeds
    const { client } = createSupabaseMock({ data: null, error: null });
    vi.mocked(createClient).mockReturnValue(client as any);
  });

  // ── Sucesso ────────────────────────────────────────────────────────────────

  it('registra log com todos os campos válidos', async () => {
    await expect(
      logAction('create_patient', 'patient', VALID_ENTITY_ID, {}, VALID_ACTOR_ID, {
        softFail: true,
        clinicId: VALID_CLINIC_ID,
      })
    ).resolves.toBeUndefined();
  });

  it('aceita clinicId null (logs de sistema)', async () => {
    await expect(
      logAction('create_patient', 'patient', VALID_ENTITY_ID, {}, VALID_ACTOR_ID, {
        softFail: true,
        clinicId: null,
      })
    ).resolves.toBeUndefined();
  });

  it('aceita sem options (clinicId omitido)', async () => {
    await expect(
      logAction('create_patient', 'patient', VALID_ENTITY_ID, {}, VALID_ACTOR_ID)
    ).resolves.toBeUndefined();
  });

  // ── Validação de UUIDs ─────────────────────────────────────────────────────

  it('soft-fail com entityId inválido', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      logAction('create', 'patient', 'nao-eh-uuid', {}, VALID_ACTOR_ID, { softFail: true })
    ).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('entityId invalido'));
    consoleSpy.mockRestore();
  });

  it('soft-fail com actorUserId inválido', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      logAction('create', 'patient', VALID_ENTITY_ID, {}, 'nao-eh-uuid', { softFail: true })
    ).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('actorUserId invalido'));
    consoleSpy.mockRestore();
  });

  it('soft-fail com clinicId inválido', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      logAction('create', 'patient', VALID_ENTITY_ID, {}, VALID_ACTOR_ID, {
        softFail: true,
        clinicId: 'nao-eh-uuid',
      })
    ).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('clinicId invalido'));
    consoleSpy.mockRestore();
  });

  // ── Campos obrigatórios ────────────────────────────────────────────────────

  it('soft-fail se action está vazio', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await logAction('', 'patient', VALID_ENTITY_ID, {}, VALID_ACTOR_ID, { softFail: true });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('obrigatorios'));
    consoleSpy.mockRestore();
  });

  // ── Falha no insert ────────────────────────────────────────────────────────

  it('soft-fail se o insert retorna erro do Supabase', async () => {
    const { client, chain } = createSupabaseMock({ data: null, error: null });
    chain.then = (onFulfilled: any) =>
      Promise.resolve({ data: null, error: { message: 'DB error' } }).then(onFulfilled);
    vi.mocked(createClient).mockReturnValue(client as any);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await logAction('create', 'patient', VALID_ENTITY_ID, {}, VALID_ACTOR_ID, { softFail: true });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('audit_logs'));
    consoleSpy.mockRestore();
  });
});
