# Rubric Scoring Utilities

**File:** `src/lib/rubric.ts`

## Purpose
Shared logic for computing rubric assessment tier and total score. Kept in `src/lib/` (not a server action) so it can be imported by both server actions and client components without `"use server"` boundary issues.

## Score Structure
12 questions, three sections:

| Section | Questions | Max pts | Multiplier |
|---|---|---|---|
| Behavioral | B1–B5 | 40 | ×2 |
| Psychometric | P1–P5 | 35 | ×1.4 |
| Cultural Fit | C1, C2, C3 | 25 | C1×2, C2×1.4, C3×1.6 |

Each question is rated 1–5 by the consultant.

## Tier Thresholds
| Score | Tier |
|---|---|
| ≥ 80 | A |
| 60–79 | B |
| < 60 | C |

## Key Exports
- `computeTier(scores: Record<string, number>): { total: number; tier: 'A' | 'B' | 'C' }`
- `RUBRIC_QUESTIONS` — ordered question list with id, label, section
- `TIER_CONFIG` — label, color class, description per tier (used by both UI and server)

## Related
- [[Features/assessment-rubric]] — the UI that uses this
- [[Database/candidate_reports]] — where scores are stored
- [[Database/candidate_badges]] — where tier is persisted
