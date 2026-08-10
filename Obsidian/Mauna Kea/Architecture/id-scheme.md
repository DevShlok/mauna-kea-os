# ID Scheme

**File:** `src/lib/ids.ts`

## Design
All entity primary keys use a prefixed UUID format. `crypto.randomUUID()` is used (not `Math.random()`) to eliminate birthday-problem collision risk.

## ID Formats
| Entity | Format | Example |
|---|---|---|
| User (`platform_users`) | `U-<uuid>` | `U-a3f2c1d4-...` |
| Candidate | `CAND-<uuid>` | `CAND-7e9a2b3f-...` |
| Float (submission) | `SUB-<uuid>` | `SUB-ff4d1e2c-...` |
| Follow-up | `FU-<uuid>` | `FU-cc8b4a5d-...` |
| Client | `CLI-<uuid>` | `CLI-9a1b2c3d-...` |
| Report | `REP-<timestamp>` | `REP-1722912000000` |
| Rubric | `RUBRIC-<timestamp>` | `RUBRIC-1722912000000` |

## Rule
Import from `@/lib/ids` everywhere. Never inline `Math.random()` or `Date.now()` for IDs.

## Scoring / Rubric IDs
Report IDs for rubric assessments use `"RUBRIC-" + Date.now()` (per Phase 2 implementation). These are varchar PKs, so no conflict with serial IDs in `candidate_reports`.
