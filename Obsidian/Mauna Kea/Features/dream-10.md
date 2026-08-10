# Dream 10

**Route:** `/${slug}/dream-companies`
**Component:** `src/features/candidate-portal/components/DreamCompaniesClient.tsx`
**Server page:** `src/app/[clientSlug]/dream-companies/page.tsx`
**Tables:** [[Database/candidates]] (dreamCos JSON), [[Database/other-tables#dream_company_status]]

## What It Is
Each candidate maintains a list of up to 10 "dream companies" — organisations where they aspire to work. Consultants track outreach progress per company, which the candidate sees in real time.

## Data Model
- `candidates.dreamCos` (JSON string[]) — the wishlist of company names
- `dream_company_status` — per-company status rows, updated by consultants

## Status Values
`Not Started → Outreach Sent → In Talks → Interviewed → Rejected | Placed`

## Tier Gate (Phase 3)
Access is gated on assessment tier. `tier = null` or `tier = 'C'` → locked state shown. `tier = 'A' | 'B'` → full access. See [[Decisions/dream-10-gating]].

## Company Suggestions
`src/lib/dreamCompanySuggestions.ts` provides smart suggestions based on candidate's sector, experience, and existing dream company selections.

## Master Client Autocomplete
Dream company names are auto-completed from `master_clients.companyName`.

## Actions
`addDreamCompanyAction`, `removeDreamCompanyAction` in `src/actions/candidate-portal.ts`
