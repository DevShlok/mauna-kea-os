# Assessment Rubric (Phase 2)

**Route:** `/dashboard/candidates/[id]/assessment`
**Component:** `src/features/candidates/components/AssessmentRubricPanel.tsx`
**Actions:** `src/actions/assessment.ts`
**Lib:** `src/lib/rubric.ts`
**Tables:** [[Database/candidate_reports]], [[Database/candidate_badges]], [[Database/candidates]]

## What It Is
A structured 12-question questionnaire filled by the consultant. Replaces the earlier "AI scoring engine" concept. Scores are computed deterministically by rule-based arithmetic — no ML.

## How to Access It
From the candidate detail page (`/dashboard/candidates/[id]`), there is an "Assessment" link in the action bar. The assessment route is `/dashboard/candidates/[id]/assessment`.

## Scoring Summary
- 12 questions, 1–5 scale each
- Three sections: Behavioral (B1–B5, weight ×2), Psychometric (P1–P5, weight ×1.4), Cultural Fit (C1–C3, variable weights)
- Total: 0–100
- Tiers: A (≥80), B (60–79), C (<60)
- Full detail: [[Architecture/scoring]]

## Data Flow on Completion
1. `completeAssessmentAction(candId, scores, assessedBy)` called
2. Upserts `candidate_reports` row (frameworkId = `'rubric-assessment'`, reportData = scores + total + tier)
3. Upserts `candidates.score` and `candidates.assessDate`
4. Upserts `candidate_badges` row (badgeType = `'assessment_complete'`, metadata.tier = computed tier)
5. Revalidates candidate page paths

## Draft vs Complete
The form can be saved as `Draft` (status stored in `candidate_reports.status = 'Draft'`) or `Complete` (fires all the above). Drafts do not update the candidate score or badge.

## Strict Data Isolation
Because manual assessments share the `candidate_reports` table with AI Workbench reports, they must be rigorously isolated by their frameworkId (`rubric-assessment`). AI Workbench operations (generate, fetch latest, delete) must explicitly exclude `rubric-assessment` from their queries, and manual assessment operations must explicitly include it.

## Candidate Visibility
Candidates see only their tier (A/B/C) and a description on the Verification page. Raw scores are never shown to candidates.

## See Also
- [[Features/verification]]
- [[Features/dream-10]] — tier gates Dream 10 access (Phase 3)
