# Candidate Portal

**Route prefix:** `/[candidateSlug]/*` (slug routing) and `/candidate/*` (redirect shims)
**Access:** `requireRole(['candidate'])`
**Layout:** `src/app/[clientSlug]/layout.tsx` — shared sidebar (CandidateSidebar) and topbar

## Routing Model
The candidate portal uses slug-based routing — the same dynamic segment `[clientSlug]` handles both client and candidate portals. The page router differentiates by looking up the slug in `candidates` first, then `clients`.

`/candidate/*` routes are redirect shims: they resolve the candidate's slug from `platformUsers.linkedCandidateId` and redirect to `/${slug}/*`.

## Page Map

| Route | What it shows |
|---|---|
| `/${slug}/` | Home (stats) OR Onboarding Shell (if `profileCompletedAt` null) |
| `/${slug}/profile` | Full profile view (CandidateProfileView) |
| `/${slug}/applications` | Applications tracker (ApplicationsClient) |
| `/${slug}/verification` | Verification status + badges + tier (VerificationStatusClient) |
| `/${slug}/jobs` | Curated jobs board (JobsClient) |
| `/${slug}/dream-companies` | Dream 10 company tracking (DreamCompaniesClient) |
| `/${slug}/consultants` | Know Your MK Partner directory (ConsultantDirectoryClient) |
| `/${slug}/guidance` | Consultant-curated guidance notes — Phase 3 |

## Sidebar Navigation
`src/features/candidate-portal/components/CandidateSidebar.tsx` — collapsible. Nav items: Home, My Applications, My Profile, My Consultants, Verification, Jobs, Dream Companies, Guidance (Phase 3).

## Key Components
| Component | File |
|---|---|
| CandidateHome | `CandidateHome.tsx` |
| CandidateProfileView | `CandidateProfileView.tsx` |
| ApplicationsClient | `ApplicationsClient.tsx` |
| VerificationStatusClient | `VerificationStatusClient.tsx` |
| JobsClient | `JobsClient.tsx` |
| DreamCompaniesClient | `DreamCompaniesClient.tsx` |
| ConsultantDirectoryClient | `ConsultantDirectoryClient.tsx` |

## See Also
- [[Features/candidate-onboarding]]
- [[Features/dream-10]]
- [[Features/jobs-board]]
- [[Features/verification]]
