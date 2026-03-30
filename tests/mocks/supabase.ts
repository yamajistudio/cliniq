import { vi } from 'vitest';

export type MockResult = { data: unknown; error: unknown };

/**
 * Cria um query chain mockado para o Supabase.
 *
 * Qualquer chamada encadeada retorna o mesmo objeto (this).
 * O objeto é thenable: `await supabase.from(...).select(...)...` resolve
 * com `result` sem precisar de `.single()` ou `.maybeSingle()`.
 *
 * Para `.single()` e `.maybeSingle()`, configure via `chain.single.mockResolvedValue(...)`.
 */
export function createQueryChain(result: MockResult = { data: null, error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & {
    then: (onFulfilled: (v: MockResult) => unknown, onRejected?: (e: unknown) => unknown) => Promise<unknown>;
  } = {
    select:       vi.fn().mockReturnThis(),
    insert:       vi.fn().mockReturnThis(),
    update:       vi.fn().mockReturnThis(),
    delete:       vi.fn().mockReturnThis(),
    upsert:       vi.fn().mockReturnThis(),
    eq:           vi.fn().mockReturnThis(),
    neq:          vi.fn().mockReturnThis(),
    in:           vi.fn().mockReturnThis(),
    gte:          vi.fn().mockReturnThis(),
    lte:          vi.fn().mockReturnThis(),
    or:           vi.fn().mockReturnThis(),
    filter:       vi.fn().mockReturnThis(),
    order:        vi.fn().mockReturnThis(),
    limit:        vi.fn().mockReturnThis(),
    range:        vi.fn().mockReturnThis(),
    single:       vi.fn().mockResolvedValue(result),
    maybeSingle:  vi.fn().mockResolvedValue(result),
    // Thenable: resolve direto ao ser `await`ed sem terminal method
    then: (onFulfilled, onRejected) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  } as any;

  return chain;
}

/**
 * Cria o mock completo do cliente Supabase.
 *
 * Uso:
 *   const { client, chain } = createSupabaseMock({ data: [...], error: null });
 *   vi.mocked(createClient).mockReturnValue(client as any);
 *
 * Para múltiplas queries sequenciais:
 *   const firstChain = createQueryChain({ data: firstResult, error: null });
 *   const secondChain = createQueryChain({ data: secondResult, error: null });
 *   client.from.mockReturnValueOnce(firstChain).mockReturnValueOnce(secondChain);
 */
export function createSupabaseMock(defaultResult: MockResult = { data: null, error: null }) {
  const chain = createQueryChain(defaultResult);

  const client = {
    from: vi.fn().mockReturnValue(chain),
    rpc:  vi.fn().mockResolvedValue({ data: null, error: null }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };

  return { client, chain };
}
