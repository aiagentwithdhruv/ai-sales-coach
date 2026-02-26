/**
 * Simple In-Memory Rate Limiter
 *
 * For serverless (Vercel), this resets on each cold start.
 * For persistent rate limiting, use Upstash Redis.
 * This provides basic protection against burst abuse within a single instance.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key.
 *
 * @param key - Unique identifier (userId, IP, etc.)
 * @param maxRequests - Max requests per window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Rate limit response helper — returns 429 if limit exceeded.
 */
export function rateLimitResponse(result: RateLimitResult): Response | null {
  if (result.allowed) return null;

  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.resetAt),
      },
    }
  );
}

// ─── Preset Limits ──────────────────────────────────────────────────────────

/** Admin routes: 10 requests per minute per user */
export function adminRateLimit(userId: string): Response | null {
  return rateLimitResponse(checkRateLimit(`admin:${userId}`, 10, 60_000));
}

/** Auth routes: 5 requests per minute per IP */
export function authRateLimit(ip: string): Response | null {
  return rateLimitResponse(checkRateLimit(`auth:${ip}`, 5, 60_000));
}

/** API routes: 60 requests per minute per user (default) */
export function apiRateLimit(userId: string): Response | null {
  return rateLimitResponse(checkRateLimit(`api:${userId}`, 60, 60_000));
}
