import { kvGet, kvSet, kvIncr } from './kv';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
  retryAfter?: number; // Seconds until reset
}

/**
 * Rate limit check using KV counters
 * @param key - Unique key for the rate limit (e.g., "ratelimit:generate:{ip}")
 * @param limit - Maximum number of requests allowed
 * @param windowSec - Time window in seconds
 * @returns Rate limit result with allowed status and metadata
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSec;
  const rateLimitKey = `ratelimit:${key}`;
  
  try {
    // Get current count
    const current = await kvGet<number>(rateLimitKey);
    const count = current ?? 0;
    
    if (count >= limit) {
      // Rate limit exceeded
      const retryAfter = resetAt - now;
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }
    
    // Increment counter
    const newCount = await kvIncr(rateLimitKey);
    
    // Set TTL on first increment (if key didn't exist)
    if (newCount === 1) {
      await kvSet(rateLimitKey, newCount, windowSec);
    }
    
    return {
      allowed: true,
      remaining: Math.max(0, limit - newCount),
      resetAt,
    };
  } catch (error) {
    console.error(`Rate limit error for key ${key}:`, error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: limit,
      resetAt,
    };
  }
}

/**
 * Helper to throw an error if rate limit is exceeded
 * Use this in API routes for cleaner error handling
 */
export async function requireWithinLimitOrThrow(
  key: string,
  limit: number,
  windowSec: number
): Promise<void> {
  const result = await rateLimit(key, limit, windowSec);
  
  if (!result.allowed) {
    const error = new Error('Rate limit exceeded') as Error & {
      statusCode: number;
      retryAfter: number;
    };
    error.statusCode = 429;
    error.retryAfter = result.retryAfter ?? windowSec;
    throw error;
  }
}

/**
 * Generate a rate limit key from IP and user agent
 */
export function getRateLimitKey(
  prefix: string,
  ip: string | null,
  userAgent: string | null
): string {
  // Create a simple hash of IP + UA for the key
  const identifier = `${ip || 'unknown'}:${userAgent || 'unknown'}`;
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${prefix}:${Math.abs(hash)}`;
}

