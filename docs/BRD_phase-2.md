# BRD Phase 2 — Manual Assessment & Rubric System
> **Timeline:** 1 sprint (~1 week) · **Depends on:** Phase 0 complete (Phase 1 can run in parallel)  
> **Goal:** Replace the original "AI scoring engine" with a structured questionnaire + consultant-applied rubric that auto-computes an A/B/C tier. The schema hooks (candidateReports, candidateBadges) already exist — this phase builds the form and arithmetic on top.

---

## Existing Codebase Context

### What already exists in schema
```
candidateReports: id, candidateId, frameworkId→frameworks.id, status, reportData (JSON), sharedWithClient, createdAt
candidateBadges: id, candId→candidates.id, badgeType, earnedAt, metadata (JSON)
  - valid badgeTypes: 'profile_complete' | 'reference_check_complete' | 'assessment_complete' | 'ai_interview_complete'
candidates.score (float) — existing numeric score field  
candidates.assessDate (varchar) — existing assessment date
```

### Key Design Decision: No New Table
The assessment is stored in `candidateReports.reportData` (a JSON field) with a special convention: when `frameworkId = 'rubric-assessment'` (a fixed framework we will create), the `reportData` JSON holds the rubric scores. The computed tier is stored in `candidateBadges.metadata.tier`.

This avoids any DB migrations.

---

## Task 1: Create the Assessment Framework Record

The `frameworks` table holds scoring frameworks used by the AI Workbench. We extend it to hold the rubric.

**One-time DB seed** (run via a migration script or admin UI):
```sql
INSERT INTO frameworks (id, name, industry, report_sections)
VALUES (
  'rubric-assessment',
  'MK Candidate Assessment Rubric',
  'Universal',
  '["Behavioral", "Psychometric", "Cultural Fit"]'
) ON CONFLICT (id) DO NOTHING;
```

This `framework_id = 'rubric-assessment'` becomes the canonical key for all rubric-based assessments.

---

## Task 2: Rubric Design (Questions + Scoring)

### Section 1: Behavioral (40 points)

| # | Question | Scale | Max Points |
|---|---|---|---|
| B1 | Describe a time you led a team through a significant change. Rate candidate's leadership clarity. | 1–5 | 10 |
| B2 | How does the candidate handle ambiguity? (consultant scores based on response) | 1–5 | 10 |
| B3 | Communication under pressure — give a specific example | 1–5 | 10 |
| B4 | Stakeholder management — how do they manage up/down? | 1–5 | 10 |

### Section 2: Psychometric (35 points)

| # | Question | Scale | Max Points |
|---|---|---|---|
| P1 | Goal orientation — are they process-driven or outcome-driven? | 1–5 | 7 |
| P2 | Risk tolerance — how do they approach uncertain decisions? | 1–5 | 7 |
| P3 | Resilience — how do they bounce back from setbacks? | 1–5 | 7 |
| P4 | Collaboration vs independence — preferred working style | 1–5 | 7 |
| P5 | Learning agility — evidence of learning new skills in past 2 years | 1–5 | 7 |

### Section 3: Cultural Fit (25 points)

| # | Question | Scale | Max Points |
|---|---|---|---|
| C1 | Alignment with organisation values | 1–5 | 10 |
| C2 | Work-life integration style | 1–5 | 7 |
| C3 | Response to feedback / coachability | 1–5 | 8 |

### Tier Thresholds
- **Tier A**: Score ≥ 80/100
- **Tier B**: Score 60–79/100
- **Tier C**: Score < 60/100

Tier is auto-computed from the total weighted score. The consultant sees the tier immediately on form submit.

---

## Task 3: Assessment Form (Consultant Side)

### New File: `src/features/candidates/components/AssessmentRubricPanel.tsx`

A consultant-facing form component. Props:
```ts
{
  candId: string;
  existingReport?: CandidateReport | null; // pre-fills if re-assessment
}
```

UI structure:
- 3 collapsible sections: Behavioral, Psychometric, Cultural Fit
- Each question has a labeled 1–5 radio button or slider
- Consultant notes textarea per section
- Submit button → computes total → shows tier badge immediately
- Save as draft button → stores `status: 'Draft'`

### New File: `src/actions/assessment.ts`

```ts
'use server';

import { db } from '@/db';
import { candidateReports, candidateBadges, candidates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

type RubricScores = {
  B1: number; B2: number; B3: number; B4: number;
  P1: number; P2: number; P3: number; P4: number; P5: number;
  C1: number; C2: number; C3: number;
  notes: { behavioral: string; psychometric: string; culturalFit: string };
};

function computeTier(scores: RubricScores): { total: number; tier: 'A' | 'B' | 'C' } {
  const behavioral = (scores.B1 + scores.B2 + scores.B3 + scores.B4) * 2; // max 40
  const psychometric = (scores.P1 + scores.P2 + scores.P3 + scores.P4 + scores.P5) * 1.4; // max 35
  const culturalFit = scores.C1 * 2 + scores.C2 * 1.4 + scores.C3 * 1.6; // max 25
  const total = Math.round(behavioral + psychometric + culturalFit);
  const tier: 'A' | 'B' | 'C' = total >= 80 ? 'A' : total >= 60 ? 'B' : 'C';
  return { total, tier };
}

export async function saveAssessmentAction(
  candId: string,
  scores: RubricScores,
  status: 'Draft' | 'Completed' = 'Completed'
) {
  const { platformUser } = await requireRole(['admin', 'consultant']);
  const { total, tier } = computeTier(scores);

  // Upsert candidateReports row
  const existing = await db
    .select()
    .from(candidateReports)
    .where(eq(candidateReports.candidateId, candId))
    // frameworkId filter needed once Drizzle supports it; use raw SQL or filter in JS
    .limit(10);

  const rubricReport = existing.find(r => r.frameworkId === 'rubric-assessment');

  const reportData = { scores, total, tier, assessedBy: platformUser?.name, assessedAt: new Date().toISOString() };

  if (rubricReport) {
    await db.update(candidateReports)
      .set({ reportData, status, sharedWithClient: false })
      .where(eq(candidateReports.id, rubricReport.id));
  } else {
    await db.insert(candidateReports).values({
      id: nanoid(),
      candidateId: candId,
      frameworkId: 'rubric-assessment',
      status,
      reportData,
      sharedWithClient: false,
    });
  }

  if (status === 'Completed') {
    // Upsert badge with tier in metadata
    await db.insert(candidateBadges).values({
      candId,
      badgeType: 'assessment_complete',
      earnedAt: new Date(),
      metadata: { tier, total },
    }).onConflictDoUpdate({
      target: [candidateBadges.candId, candidateBadges.badgeType],
      set: { earnedAt: new Date(), metadata: { tier, total } },
    });

    // Update candidates.score with the numeric total
    await db.update(candidates).set({ score: total, assessDate: new Date().toISOString().split('T')[0] }).where(eq(candidates.id, candId));
  }

  revalidatePath(`/dashboard/candidates/${candId}`);
  return { success: true, tier, total };
}

export async function getAssessmentAction(candId: string) {
  const reports = await db.select().from(candidateReports).where(eq(candidateReports.candidateId, candId));
  return reports.find(r => r.frameworkId === 'rubric-assessment') ?? null;
}
```

---

## Task 4: Wire into Candidate Detail Page

**File: `src/app/dashboard/candidates/[id]/page.tsx`**
- Add "Assessment" tab alongside existing tabs.
- Server-side: call `getAssessmentAction(candId)` and pass `existingReport` to `AssessmentRubricPanel`.

**Tab display:**
- If assessment exists with `status = 'Completed'`: show the computed tier badge (A/B/C in color) + score + date assessed.
- If draft or not started: show the form.
- Always show "Re-assess" button to open form again.

---

## Task 5: Candidate-Side Assessment Visibility

**File: `src/features/candidate-portal/components/VerificationStatusClient.tsx`**
- Add a section "Your Assessment Tier" that reads from `candidateBadges` where `badgeType = 'assessment_complete'`.
- Show: Tier badge (A/B/C), date assessed, brief description of what tier means.
- **Do not show the raw scores** — only the tier and a brief paragraph: "Your profile has been reviewed by the Mauna Kea team across behavioral, psychometric, and cultural dimensions."

---

## DB Changes Required

No schema migrations needed. All columns and tables are pre-existing:
- `candidateReports.reportData` (JSON) stores rubric scores ✅
- `candidateBadges.metadata` (JSON) stores tier ✅
- `candidates.score`, `assessDate` store computed total + date ✅
- One-time seed: insert `frameworks` row with `id = 'rubric-assessment'` ✅ (script only)

---

## Testing Checklist
- [ ] Consultant opens candidate detail → Assessment tab visible
- [ ] Fill all 12 rubric questions → tier computed correctly (manual math check)
- [ ] Save as Draft → `candidateReports.status = 'Draft'`, no badge created
- [ ] Complete assessment → badge created, `candidates.score` updated
- [ ] Re-assess → existing report updated, not duplicated
- [ ] Candidate view shows tier badge, not raw scores
- [ ] `npx tsc --noEmit` passes 0 errors
