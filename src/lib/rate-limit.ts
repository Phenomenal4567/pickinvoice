import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only instantiate if env vars are available
function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

let _authLimiter: Ratelimit | null = null;
let _aiLimiter: Ratelimit | null = null;
let _generalLimiter: Ratelimit | null = null;

function getLimiters() {
  const redis = getRedis();
  if (!redis) return { authLimiter: null, aiLimiter: null, generalLimiter: null };

  if (!_authLimiter) {
    _authLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), prefix: 'pickinvoice:auth' });
    _aiLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'pickinvoice:ai' });
    _generalLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'), prefix: 'pickinvoice:general' });
  }

  return { authLimiter: _authLimiter, aiLimiter: _aiLimiter, generalLimiter: _generalLimiter };
}

export type RateLimitType = 'auth' | 'ai' | 'general';

export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'general'
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  const { authLimiter, aiLimiter, generalLimiter } = getLimiters();

  // If Redis is not configured, allow all requests (dev mode)
  if (!authLimiter) return { success: true };

  const limiter = type === 'auth' ? authLimiter : type === 'ai' ? aiLimiter : generalLimiter;
  const result = await limiter!.limit(identifier);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
