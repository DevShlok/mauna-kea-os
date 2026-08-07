/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * Works without any external service (no Redis required). Safe for single-
 * instance Vercel deployments. If you scale to multiple Vercel regions in the
 * future, replace this with an Upstash Redis rate limiter:
 *   https://github.com/upstash/ratelimit
 *
 * Usage:
 *   const { success, retryAfter } = await rateLimit(req, { limit: 10, windowMs: 60_000 });
 *   if (!success) return rateLimitResponse(retryAfter);
 */

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface RateLimitOptions {
  /** Max number of requests allowed within the window */
  limit: number;
  /** Window size in milliseconds (e.g. 60_000 = 1 minute) */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  /** Seconds until the client can retry (only present when success = false) */
  retryAfter?: number;
}

// In-memory store: key → array of request timestamps
const store = new Map<string, number[]>();

// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, timestamps]) => {
    // Remove keys whose newest timestamp is older than 10 minutes
    if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > 10 * 60_000) {
      store.delete(key);
    }
  });
}, 5 * 60_000); // Run cleanup every 5 minutes

/**
 * Extracts the best-available client IP from a Next.js request.
 * Prefers the Vercel real-IP header, then x-forwarded-for, then falls back
 * to a constant so that local dev still works.
 */
export function getClientIp(req: Request | NextRequest): string {
  const headers = req.headers;
  // Vercel injects this on their edge network
  const vercelIp = headers.get("x-real-ip");
  if (vercelIp) return vercelIp;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  // Local development fallback — not a real IP but works for testing
  return "127.0.0.1";
}

/**
 * Check whether the current request is within the allowed rate limit.
 *
 * @param req     The incoming request (used to derive the client IP)
 * @param route   A unique identifier for this route (e.g. "generate-report")
 * @param options Rate limit configuration
 */
export function rateLimit(
  req: Request | NextRequest,
  route: string,
  options: RateLimitOptions
): RateLimitResult {
  const ip = getClientIp(req);
  const key = `${ip}::${route}`;
  const now = Date.now();
  const windowStart = now - options.windowMs;

  // Retrieve existing timestamps for this key, drop anything outside the window
  const timestamps = (store.get(key) ?? []).filter((ts) => ts > windowStart);

  if (timestamps.length >= options.limit) {
    // Oldest timestamp in the window — client must wait until it expires
    const oldestInWindow = timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + options.windowMs - now) / 1000);
    store.set(key, timestamps);
    return { success: false, retryAfter };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return { success: true };
}

/**
 * Convenience function: returns a standardised 429 response with a
 * Retry-After header so clients know exactly when to try again.
 */
export function rateLimitResponse(retryAfter = 60): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please slow down.",
      retryAfterSeconds: retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + retryAfter),
      },
    }
  );
}
