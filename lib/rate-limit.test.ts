import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRateLimiter } from './rate-limit';

// Use unique windowMs per suite to avoid sharing buckets with module-level limiters

describe('createRateLimiter', () => {
  describe('dentro da janela', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 99_001 });
    const userId = 'user-rl-test-1';

    beforeEach(() => {
      limiter.reset(userId);
    });

    it('primeira requisição é permitida com remaining correto', () => {
      const result = limiter.check(userId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // maxRequests - 1
    });

    it('permite até o limite (3 requisições)', () => {
      limiter.check(userId); // 1
      limiter.check(userId); // 2
      const third = limiter.check(userId); // 3
      expect(third.allowed).toBe(true);
      expect(third.remaining).toBe(0);
    });

    it('bloqueia na 4ª requisição (acima do limite)', () => {
      limiter.check(userId);
      limiter.check(userId);
      limiter.check(userId);
      const fourth = limiter.check(userId);
      expect(fourth.allowed).toBe(false);
      expect(fourth.remaining).toBe(0);
    });

    it('identifiers diferentes não interferem entre si', () => {
      const userA = 'user-rl-a';
      const userB = 'user-rl-b';
      limiter.reset(userA);
      limiter.reset(userB);

      limiter.check(userA);
      limiter.check(userA);
      limiter.check(userA);
      limiter.check(userA); // blocked

      const bResult = limiter.check(userB);
      expect(bResult.allowed).toBe(true);
    });
  });

  describe('reset após janela expirada', () => {
    it('permite nova requisição após a janela expirar', () => {
      vi.useFakeTimers();
      const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1_000 });
      const userId = 'user-rl-expiry';

      limiter.check(userId);
      limiter.check(userId);
      expect(limiter.check(userId).allowed).toBe(false);

      // Avança além da janela
      vi.advanceTimersByTime(1_001);

      const result = limiter.check(userId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      vi.useRealTimers();
    });
  });

  describe('reset manual', () => {
    it('reset limpa o bucket e permite nova requisição', () => {
      const limiter = createRateLimiter({ maxRequests: 1, windowMs: 99_002 });
      const userId = 'user-rl-reset';
      limiter.reset(userId);

      limiter.check(userId); // 1 — atinge limite
      expect(limiter.check(userId).allowed).toBe(false);

      limiter.reset(userId);
      expect(limiter.check(userId).allowed).toBe(true);
    });
  });

  describe('resetAt', () => {
    it('resetAt é no futuro', () => {
      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 99_003 });
      const userId = 'user-rl-reset-at';
      limiter.reset(userId);
      const before = Date.now();
      const result = limiter.check(userId);
      expect(result.resetAt).toBeGreaterThan(before);
    });
  });
});
