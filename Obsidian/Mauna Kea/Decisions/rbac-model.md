# Decision: 4-Tier RBAC Enforcement Model

**Status:** Active  
**Confirmed in:** `src/lib/auth.ts` — `requireRole()`, `platform_users.role`

## What Was Decided
A simple 4-role model enforced at the page/route level via a single `requireRole(allowedRoles[])` server function. Roles: `admin | consultant | client | candidate`.

## How It Is Enforced
Every protected page or API route calls `requireRole(['admin', 'consultant'])` (or whichever roles apply) as its first line. There is no middleware-level enforcement — role checking happens in the Server Component or API handler.

```ts
// Every consultant/admin page starts with:
const { platformUser } = await requireRole(['admin', 'consultant']);

// Every candidate page:
const { platformUser } = await requireRole(['candidate']);

// Every client page:
const { platformUser } = await requireRole(['client']);
```

## Why Route-Level (Not Middleware)
- Next.js middleware runs on the edge and has access limitations (no DB queries)
- Role data lives in PostgreSQL, not in the JWT claims (Supabase does not embed custom roles in JWT by default)
- Route-level checking allows fine-grained per-page access control (e.g. an admin-only sub-page within the dashboard)

## Role Meanings

| Role | What they can access | Determined by |
|---|---|---|
| `admin` | Full dashboard + admin panel | Manual assignment in `platform_users.role` |
| `consultant` | Full dashboard (no admin panel) | Auto-assigned for `@maunakea.co.in` email on first login |
| `client` | Client portal only (`/[clientSlug]`) | Manual assignment; `linkedClientId` set to their company |
| `candidate` | Candidate portal only (`/${slug}/*`) | Auto-assigned for all other email domains on first login |

## Redirect-on-Mismatch (not 403)
When a user hits a page for a role they don't have, they are silently redirected to their own portal — not shown a 403 error page. This avoids leaking the existence of admin pages to candidates.

## Limitations Acknowledged
- No fine-grained permission system (e.g., "consultant can view but not delete")
- Admin vs Consultant distinction is only meaningful in a few places (admin panel access)
- If more granular permissions are needed in future, a `permissions` JSON array on `platform_users` can extend this without a schema migration

## No Raw Scores to Candidates
Relatedly, there is a convention (not enforced by RBAC) that certain fields are never sent to candidate-facing pages. Example: `candidates.score` and rubric raw scores are computed server-side but not passed to `DreamCompaniesClient` or `VerificationStatusClient` props. See [[Decisions/no-raw-scores-to-candidates]].

## See Also
- [[Architecture/auth-and-rbac]]
- [[Database/platform_users]]
