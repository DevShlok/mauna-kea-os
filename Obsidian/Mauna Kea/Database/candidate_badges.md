# candidate_badges

**Table:** `candidate_badges` | **PK:** `id serial`
**Unique constraint:** `(candId, badgeType)` — one badge of each type per candidate

## Purpose
Achievement/milestone tracking for candidates. Drives badge display in the candidate portal and gates certain features (e.g. Dream 10 requires `assessment_complete` with tier ≠ C).

## Badge Types
| badgeType | When earned |
|---|---|
| `profile_complete` | Onboarding step 4 finished and `profileCompletedAt` set |
| `reference_check_complete` | At least one reference check marked verified |
| `assessment_complete` | Consultant completes rubric assessment (Phase 2) |
| `ai_interview_complete` | AI interview flow completed (future) |

## metadata JSON (per badge type)
- `assessment_complete`: `{ tier: 'A' | 'B' | 'C', total: number }`
- Others: currently `{}`

## Relationships
- → [[candidates]] via `candId` (ON DELETE CASCADE)

## Feature Dependencies
- [[Features/assessment-rubric]] — writes the badge on completion
- [[Features/dream-10]] — reads `assessment_complete.metadata.tier` for gating (Phase 3)
- [[Features/candidate-portal]] — VerificationBadgesPanel renders all badges
