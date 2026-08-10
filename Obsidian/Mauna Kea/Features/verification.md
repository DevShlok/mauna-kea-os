# Verification

**Route:** `/${slug}/verification`
**Component:** `src/features/candidate-portal/components/VerificationStatusClient.tsx`
**Tables:** [[Database/other-tables#candidate_verifications]], [[Database/other-tables#reference_checks]], [[Database/candidate_badges]]

## What It Is
The verification page is the candidate's trust and credential hub. It surfaces:
1. Overall verification status (Not Started → In Progress → Verified)
2. Earned badges (profile_complete, reference_check_complete, assessment_complete)
3. Reference check summaries (shared ones only)
4. Assessment tier (A/B/C) — if `assessment_complete` badge exists

## Badge Display
`src/features/candidate-portal/components/VerificationBadgesPanel.tsx` renders all earned badges. Data comes from `candidate_badges` table.

## Tier Card
If `assessment_complete` badge is present:
- Shows tier (A/B/C) with description
- Raw score (0–100) is NOT shown to candidates (by design)
- See [[Decisions/no-raw-scores-to-candidates]]

## Reference Checks Shown
Only `reference_checks` rows where `isSharedWithClient = true` (yes the column is named isSharedWithClient but also governs candidate visibility — the naming is a minor inconsistency). Renders: referee name, relationship, summary positives/improvements.

## Empty State Handling
If no badges or references exist yet, shows appropriate empty state prompts rather than blank sections.

## Server Page
`src/app/[clientSlug]/verification/page.tsx` — fetches verification status, reference checks, and assessment badge in parallel.
