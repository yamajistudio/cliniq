/**
 * Lightweight in-memory rate limiter.
 * Works in serverless (per-instance). Not distributed — for distributed,
 * upgrade to @upstash/ratelimit with Redis.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
 *   const result = limiter.check(identifier);
 *   if (!result.allowed) throw new Error("Too many requests");
 */

type RateLimiterConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type BucketEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Map<string, BucketEntry>>();

// Cleanup interval: every 5 minutes, remove expired entries
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [limiterKey, limiterBuckets] of buckets) {
      for (const [key, entry] of limiterBuckets) {
        if (now > entry.resetAt) {
          limiterBuckets.delete(key);
        }
      }
      if (limiterBuckets.size === 0) {
        buckets.delete(limiterKey);
      }
    }
  }, 5 * 60 * 1000);
}

export function createRateLimiter(config: RateLimiterConfig) {
  const limiterKey = `${config.maxRequests}:${config.windowMs}`;

  if (!buckets.has(limiterKey)) {
    buckets.set(limiterKey, new Map());
  }

  scheduleCleanup();

  return {
    check(identifier: string): RateLimitResult {
      const limiterBuckets = buckets.get(limiterKey)!;
      const now = Date.now();
      const existing = limiterBuckets.get(identifier);

      // If no entry or window expired, create new
      if (!existing || now > existing.resetAt) {
        const entry: BucketEntry = {
          count: 1,
          resetAt: now + config.windowMs,
        };
        limiterBuckets.set(identifier, entry);
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetAt: entry.resetAt,
        };
      }

      // Increment
      existing.count += 1;

      if (existing.count > config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: existing.resetAt,
        };
      }

      return {
        allowed: true,
        remaining: config.maxRequests - existing.count,
        resetAt: existing.resetAt,
      };
    },

    reset(identifier: string): void {
      const limiterBuckets = buckets.get(limiterKey);
      limiterBuckets?.delete(identifier);
    },
  };
}

// ── Pre-configured limiters ──────────────────────────────────────────────────

/** Auth actions: 10 attempts per minute per IP/email */
export const authLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
});

/** General actions: 30 requests per minute per user */
export const actionLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
});

/** Sensitive actions (password reset, invite): 3 per minute */
export const sensitiveLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 60 * 1000,
});

/** Delete operations: 10 per minute per user */
export const deleteLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});

/** Payment operations: 20 per minute per user */
export const paymentLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60_000,
});

/** Permission/role changes: 5 per minute per user */
export const permissionLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});
