# Rate Limiting

**File:** `src/lib/rate-limit.ts`

## Design
In-memory sliding-window rate limiter. No Redis. Works on single-instance Vercel deployments. Intentionally simple — if multi-region or serverless cold-start isolation becomes a problem, replace with Upstash Redis (`@upstash/ratelimit`).

## How It Works
- `Map<string, number[]>` keyed by `${clientIP}::${routeName}`
- Each entry = array of timestamps within the current window
- On each request: drop timestamps older than `windowMs`, count remainder
- If count ≥ limit → 429; else append timestamp and allow

## Cleanup
`setInterval` every 5 minutes drops keys whose most-recent timestamp is >10 minutes old. Prevents unbounded growth.

## Usage Pattern
```ts
const { success, retryAfter } = rateLimit(req, 'generate-report', { limit: 5, windowMs: 60_000 });
if (!success) return rateLimitResponse(retryAfter);
```

## Per-Route Limits (at time of initial setup)
| Route | Limit | Window |
|---|---|---|
| `/api/generate-report` | 5 | 1 min |
| `/api/extract-profile` | 10 | 1 min |
| `/api/apify-linkedin` | 3 | 5 min |
| `/api/parse-cv` | 10 | 1 min |
| Upload routes | 10–20 | 1 min |
| Auth routes | 5 | 15 min |
| General | 100 | 1 min |

## IP Extraction
Checks `x-real-ip` (Vercel edge), then `x-forwarded-for`, then falls back to `127.0.0.1` for local dev.
