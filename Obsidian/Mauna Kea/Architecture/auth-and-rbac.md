# Auth & RBAC

**File:** `src/lib/auth.ts`

## Authentication Provider
Supabase Auth. Email/password and Google OAuth both supported. Supabase issues JWTs; the app verifies them via `createClient()` (server-side) on every request.

## The `requireRole()` Function
Used at the top of every Server Component page and API route that requires authentication:
```ts
const { platformUser, userRole, email } = await requireRole(['admin', 'consultant']);
```
- Calls `supabase.auth.getUser()` (cached per request via React `cache()`)
- Looks up `platform_users` by email
- If not found: auto-provisions the user (see below)
- Checks `role` against `allowedRoles`; redirects on mismatch

## RBAC Redirect Matrix
If a user hits a page they're not allowed on, they're redirected — not shown a 403:

| Role | Unauthorized redirect |
|---|---|
| `client` | `/${clientSlug}` |
| `candidate` | `/${candidateSlug}` |
| `admin` / `consultant` | `/dashboard` |

## Auto-Provisioning on First Login
1. Email resolved from Supabase JWT
2. `@maunakea.co.in` → `role = consultant`; everything else → `role = candidate`
3. `platform_users` row inserted
4. For `candidate` role: `candidates` row found-or-created by email, `linkedCandidateId` set

## Slug Resolution
`requireRole` calls `getOrCreateCandidateSlug()` / `getOrCreateClientSlug()` to ensure slugs always exist before redirecting.

## Caching
`getAuthenticatedUser` is wrapped in React `cache()` — resolves only once per request, preventing duplicate Supabase calls when multiple Server Components call `requireRole` on the same page.

## See Also
- [[Decisions/rbac-model]]
- [[Database/platform_users]]
