# Decision: No Raw Scores Shown to Candidates

**Status:** Active  
**Confirmed in:** `src/features/candidate-portal/components/VerificationStatusClient.tsx` — only tier rendered, not numeric total

## What Was Decided
Candidates see their assessment **tier** (A, B, or C) and a brief description. The numeric score (e.g. 78/100) is never sent to or displayed in the candidate portal.

## Why
- Scores are a consultant tool — they exist to enable internal ranking, not to grade the candidate
- Showing a raw number risks the candidate feeling judged or demotivated on a poor score
- The tier (A/B/C) is actionable for the candidate (e.g. understand Dream 10 access eligibility) without exposing the raw arithmetic
- Avoids gaming: if candidates know the exact scoring formula and weights, they may try to optimise for the score rather than genuine self-presentation

## Implementation
The verification page server component fetches the assessment badge (which contains `metadata.tier` and `metadata.total`). Only `tier` is passed as a prop to `VerificationStatusClient`. The `total` field is intentionally destructured out.

## See Also
- [[Features/verification]]
- [[Features/assessment-rubric]]
- [[Decisions/rbac-model]]
