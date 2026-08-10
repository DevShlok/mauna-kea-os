# platform_users

**Table:** `platform_users` | **PK:** `id varchar(50)` (format: `U-<uuid>`)

## Purpose
Single user table for all platform roles. A user's `role` field determines which portal they land on and what they can access. See [[Decisions/rbac-model]].

## Roles
| Role | Description | Links to |
|---|---|---|
| `admin` | Full access, internal Mauna Kea staff | — |
| `consultant` | Internal recruiter, manages mandates and candidates | — |
| `client` | Hiring manager at client company | `linkedClientId` → [[clients]] |
| `candidate` | Executive being placed | `linkedCandidateId` → [[candidates]] |

## Notable Columns
- `linkedClientId` — set when `role = 'client'`; used by auth to redirect to `/[clientSlug]/`
- `linkedCandidateId` — set when `role = 'candidate'`; auto-created on first login if not found
- `bio`, `vertical`, `expertiseTags`, `linkedinUrl`, `consultantProfilePic` — consultant profile for the "Know Your MK Partner" directory shown to candidates
- `reportingManagerId` — HR org chart within the team (self-referential)
- `maxLeaves` — annual leave entitlement (default 20)
- `isDeleted` — soft delete

## Auto-provisioning Logic
On first login (via `src/lib/auth.ts`):
1. Supabase auth resolves email
2. If `@maunakea.co.in` → role defaults to `consultant`; otherwise `candidate`
3. `platform_users` row created if not found
4. For `candidate` role: `candidates` row found-or-created by email, then linked

## Key Indexes
`email`, `role`, `isDeleted`
