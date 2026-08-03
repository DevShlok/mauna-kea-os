# Phase 4 — Detailed Implementation Plan
## Assessment Framework (Skeleton — No AI)

> **Priority:** P1 (administrative framework), P2 (AI scoring engine)  
> **Timeline Estimate:** 3 weeks  
> **Dependency:** Phase 1 complete (candidate portal structure). Phase 2 optional but recommended (Verified Badge component reusable here).

---

## Overview

Phase 4 builds the **administrative scaffolding** for the three-step assessment process. The AI scoring, video interview engine, and psychometric test engine are explicitly **not built in this phase** — they require external tools and significant time to build correctly (as noted in the BRD).

What Phase 4 delivers:
- A full assessment intake and scheduling workflow
- A consultant/admin-facing assessment management tool
- A candidate-facing results view showing **only 2–3 improvement pointers** (no scores, no full report)
- The eligibility flag (`is_mk_assessed`, `assessment_score_tier`) that gates the Phase 5 Premium Representation Program
- An assessment feedback / concern submission mechanism for candidates

The actual questions, video, and automated scoring are Phase 4+ (marked in schema but not built).

---

## Resolved Design Decisions (from BRD comments)

| Decision | Resolution |
|---|---|
| Score tier threshold for premium eligibility | Score tier A/B/C, assigned **manually** by consultant/admin |
| Who assigns score tier? | Consultant or admin — not auto-calculated |
| Do candidates see scores? | **No** — only 2–3 improvement pointers, no scores, no ratings |
| How to handle disputes? | Candidate submits concern in writing via a simple form; stored but does not modify assessment |
| First ~1,000 candidates | Manually validated by team before auto-rating trusted |

---

## DB Schema Changes (Migration)

### Modified table — `candidates`

```typescript
// Add to existing candidates table
isMkAssessed: boolean('is_mk_assessed').default(false),
assessmentScoreTier: varchar('assessment_score_tier', { length: 5 }),
// A | B | C — assigned by consultant/admin after full assessment review
// NULL = not yet assigned
```

### New Tables — `src/db/schema.ts`

```typescript
// ─── ASSESSMENTS ─────────────────────────────────────────────────
export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  
  // Overall status
  status: varchar('status', { length: 50 }).default('Not Scheduled'),
  // Not Scheduled | Scheduled | Step 1 Pending | Step 1 Complete
  // | Step 2 Pending | Step 2 Complete | Step 3 Pending | Step 3 Complete
  // | Under Review | Published

  // Scheduling
  scheduledAt: datetime('scheduled_at'),
  scheduledBy: varchar('scheduled_by', { length: 255 }), // consultant name

  // Step 1 — Psychometric / MCQ
  step1Type: varchar('step1_type', { length: 50 }).default('psychometric'),
  step1Status: varchar('step1_status', { length: 50 }).default('Pending'),
  step1ScheduledAt: datetime('step1_scheduled_at'),
  step1CompletedAt: datetime('step1_completed_at'),
  step1Notes: text('step1_notes'), // internal consultant notes

  // Step 2 — AI Video Interview (placeholder — no video in Phase 4)
  step2Type: varchar('step2_type', { length: 50 }).default('video'),
  step2Status: varchar('step2_status', { length: 50 }).default('Pending'),
  step2ScheduledAt: datetime('step2_scheduled_at'),
  step2CompletedAt: datetime('step2_completed_at'),
  step2Notes: text('step2_notes'),

  // Step 3 — Human Interview
  step3Type: varchar('step3_type', { length: 50 }).default('human'),
  step3Status: varchar('step3_status', { length: 50 }).default('Pending'),
  step3ScheduledAt: datetime('step3_scheduled_at'),
  step3CompletedAt: datetime('step3_completed_at'),
  step3Interviewer: varchar('step3_interviewer', { length: 255 }),
  step3Notes: text('step3_notes'),

  // Full report — ONLY for admin/client, never shown to candidate
  fullReport: json('full_report').$type<Record<string, any>>().default({}),
  fullReportSharedWithClient: boolean('full_report_shared_with_client').default(false),

  // Candidate-facing output ONLY — max 3 improvement pointers
  candidatePointers: json('candidate_pointers').$type<{
    area: string;
    suggestion: string;
    icon?: string; // optional emoji/icon for the UI
  }[]>().default([]),

  // Score tier (manually assigned by consultant/admin)
  scoreTier: varchar('score_tier', { length: 5 }),
  // A | B | C — gates premium program eligibility

  // Publication
  isPublished: boolean('is_published').default(false),
  publishedAt: datetime('published_at'),
  publishedBy: varchar('published_by', { length: 255 }),

  createdAt: datetime('created_at').default(sql`now()`),
  updatedAt: datetime('updated_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('ass_cand_id_idx').on(table.candId),
  statusIdx: index('ass_status_idx').on(table.status),
}));

// ─── ASSESSMENT FEEDBACK (CANDIDATE CONCERNS) ────────────────────
export const assessmentFeedback = pgTable('assessment_feedback', {
  id: serial('id').primaryKey(),
  assessmentId: int('assessment_id').notNull().references(() => assessments.id),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  feedbackText: text('feedback_text').notNull(),
  isReviewed: boolean('is_reviewed').default(false),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  reviewNotes: text('review_notes'), // internal admin notes on the concern
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  assessmentIdIdx: index('af_assessment_id_idx').on(table.assessmentId),
  candIdIdx: index('af_cand_id_idx').on(table.candId),
}));
```

### New types
```typescript
export type Assessment = typeof assessments.$inferSelect;
export type AssessmentFeedback = typeof assessmentFeedback.$inferSelect;
```

### Migration file — `src/db/migrations/0029_candidate_portal_phase4.sql`
```sql
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_mk_assessed BOOLEAN DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assessment_score_tier VARCHAR(5);

CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id),
  status VARCHAR(50) DEFAULT 'Not Scheduled',
  scheduled_at TIMESTAMP,
  scheduled_by VARCHAR(255),
  step1_type VARCHAR(50) DEFAULT 'psychometric',
  step1_status VARCHAR(50) DEFAULT 'Pending',
  step1_scheduled_at TIMESTAMP,
  step1_completed_at TIMESTAMP,
  step1_notes TEXT,
  step2_type VARCHAR(50) DEFAULT 'video',
  step2_status VARCHAR(50) DEFAULT 'Pending',
  step2_scheduled_at TIMESTAMP,
  step2_completed_at TIMESTAMP,
  step2_notes TEXT,
  step3_type VARCHAR(50) DEFAULT 'human',
  step3_status VARCHAR(50) DEFAULT 'Pending',
  step3_scheduled_at TIMESTAMP,
  step3_completed_at TIMESTAMP,
  step3_interviewer VARCHAR(255),
  step3_notes TEXT,
  full_report JSON DEFAULT '{}',
  full_report_shared_with_client BOOLEAN DEFAULT false,
  candidate_pointers JSON DEFAULT '[]',
  score_tier VARCHAR(5),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  published_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_feedback (
  id SERIAL PRIMARY KEY,
  assessment_id INT NOT NULL REFERENCES assessments(id),
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id),
  feedback_text TEXT NOT NULL,
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by VARCHAR(255),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ass_cand_id_idx ON assessments(cand_id);
CREATE INDEX IF NOT EXISTS af_assessment_id_idx ON assessment_feedback(assessment_id);
```

---

## Feature 4.1 — Assessment Management (Consultant / Admin — MK OS)

### [NEW] `src/app/dashboard/assessments/page.tsx`
### [NEW] `src/features/assessments/components/AssessmentsListClient.tsx`

**List view:**
Table of all candidates with assessments, filterable by status:
- Not Scheduled / Scheduled / In Progress / Under Review / Published
- Columns: Candidate name, Current company, Assessment status, Step 1/2/3 status, Score Tier, Published?

**"Schedule Assessment" button:** Opens modal to select a candidate + set Step 1 date.

---

### [NEW] `src/app/dashboard/assessments/[id]/page.tsx`
### [NEW] `src/features/assessments/components/AssessmentDetailClient.tsx`

**Assessment detail page — full management UI:**

**Section A — Overall Status:**
```
Candidate: Rahul Sharma · CFO · Hindustan Unilever
Assessment Status: [Step 3 Complete ▼]
Score Tier: [A ▼]  (A = Top tier · B = Strong · C = Developing)
[Mark as Fully Assessed]  ← sets is_mk_assessed = true on candidates table
```

**Section B — Three-Step Progress Tracker:**

```
Step 1 — Psychometric / MCQ            Step 2 — Video Interview    Step 3 — Human Interview
─────────────────────────────────      ────────────────────────    ────────────────────────
Status:    [Pending ▼]                 Status: [Pending ▼]         Status: [Pending ▼]
Scheduled: [date picker]               Scheduled: [date picker]    Scheduled: [date picker]
Completed: [date picker]               Completed: [date picker]    Completed: [date picker]
                                                                   Interviewer: [text]
Notes:     [textarea]                  Notes: [textarea]           Notes: [textarea]
```

Phase 4 note: Step 2 (video) is a scheduled placeholder. The actual video intake tool is Phase 4+.

**Section C — Full Report (Admin / Client Only):**
Rich text / structured JSON input for the full assessment report. This is NEVER shown to the candidate.

```
[Full Report — Client / Admin Only]
[Toggle: Share report with client: YES / NO]

[Rich text editor for full findings]
```

**Section D — Candidate-Facing Pointers (Max 3):**

```
┌──────────────────────────────────────────────────────────┐
│  Candidate-Facing Improvement Pointers  (Max 3)          │
│                                                          │
│  Pointer 1:                                              │
│  Area: [text input — e.g. "Strategic Communication"]     │
│  Suggestion: [textarea — constructive, non-offensive]    │
│                                                          │
│  Pointer 2:  [same fields]                               │
│                                                          │
│  Pointer 3:  [same fields]                               │
│                                                          │
│  [Add Pointer]  (disabled if 3 already added)            │
│                                                          │
│  ⚠️  These are the ONLY assessment details the candidate │
│     will see. Raw scores and full report stay internal.  │
└──────────────────────────────────────────────────────────┘
```

**Section E — Publish Results:**
```
[Publish to Candidate]  ← shows confirmation dialog
```
On publish:
- Sets `isPublished = true`, `publishedAt = now()`, `publishedBy = currentUser`
- Sets `candidates.isMkAssessed = true` if Score Tier A or B
- Sets `candidates.assessmentScoreTier = scoreTier`
- Creates `candidateNotifications`: "Your Mauna Kea assessment results are now available."

**Actions — `src/actions/assessments.ts`:**
```typescript
export async function scheduleAssessmentAction(candId: string, data: {...}) { ... }
export async function updateAssessmentStepAction(id: number, step: 1|2|3, data: {...}) { ... }
export async function updateFullReportAction(id: number, report: any, sharedWithClient: boolean) { ... }
export async function updateCandidatePointersAction(id: number, pointers: {...}[]) { ... }
export async function publishAssessmentAction(id: number, scoreTier: string, publishedBy: string) { ... }
export async function submitCandidateFeedbackAction(assessmentId: number, candId: string, text: string) { ... }
```

---

## Feature 4.2 — Assessment View in Candidate Detail (MK OS)

### [MODIFY] Candidate detail page or `FlCandidateClient.tsx`

Add an **"Assessment"** tab showing:
- Assessment status (Not Scheduled / Step 1 / etc.)
- Score Tier (if published)
- "Is MK Assessed" flag (drives premium program eligibility)
- Quick link to full assessment detail page

Also add a badge to candidate cards in the pipeline:
- "Assessed A" / "Assessed B" / "Assessed C" badge on candidate rows

---

## Feature 4.3 — Candidate Portal: Assessment Status View

### [NEW] `src/app/candidate/assessment/page.tsx`
### [NEW] `src/features/candidate-portal/components/AssessmentClient.tsx`

**Server data fetch:**
```typescript
const assessment = await db.select().from(assessments)
  .where(eq(assessments.candId, linkedCandidateId))
  .orderBy(desc(assessments.createdAt))
  .limit(1);
// Note: If no assessment exists, show "Not yet scheduled" state
```

**Candidate UI:**

**State 1 — Not Scheduled:**
```
┌──────────────────────────────────────────────────────────┐
│  🔬  My Assessment                                        │
│                                                          │
│  Your assessment hasn't been scheduled yet.             │
│                                                          │
│  The Mauna Kea assessment is a 3-step process that       │
│  helps us understand your strengths and potential.       │
│  Your consultant will reach out to schedule it.          │
└──────────────────────────────────────────────────────────┘
```

**State 2 — In Progress:**
```
┌──────────────────────────────────────────────────────────┐
│  🔬  My Assessment — In Progress                          │
│                                                          │
│  ●──────────────●──────────────○                        │
│  Step 1         Step 2         Step 3                   │
│  Psychometric   Video          Human Interview           │
│  ✓ Complete     Scheduled      Pending                   │
│  15 Jul 2025    22 Jul 2025    –                         │
└──────────────────────────────────────────────────────────┘
```

**State 3 — Published (Results Available):**
```
┌──────────────────────────────────────────────────────────┐
│  🔬  My Assessment — Complete                            │
│                                                          │
│  ✅  All 3 steps completed                              │
│                                                          │
│  📋  Areas to Explore                                    │
│  ─────────────────────────────────────────────────────  │
│  💡  Strategic Communication                             │
│     "Consider exploring board-level communication        │
│      frameworks — this tends to be the gap at CFO       │
│      transition."                                        │
│                                                          │
│  💡  Cross-functional Influence                          │
│     "Building formal influence mechanisms beyond         │
│      Finance can strengthen your candidacy."            │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  These are suggestions to consider, not judgments.      │
│  [Share Feedback on this Assessment →]                  │
└──────────────────────────────────────────────────────────┘
```

**Rules for candidate view:**
- Show ONLY `candidatePointers` — nothing from `fullReport`
- No score, no tier, no rating labels
- Framed as "areas to explore" or "suggestions to consider"
- Maximum 3 pointers enforced on the consultant input side

---

## Feature 4.4 — Assessment Feedback Form (Candidate Concern Submission)

### [NEW] `src/app/candidate/assessment/feedback/page.tsx`

```
┌──────────────────────────────────────────────────────────┐
│  📝  Assessment Feedback                                 │
│                                                          │
│  If you have feedback or concerns about your            │
│  assessment experience, please share them below.        │
│  Our team will review all submissions.                  │
│                                                          │
│  [Textarea — max 1000 characters]                        │
│                                                          │
│  Please note: Submitting feedback does not change       │
│  your assessment outcome.                               │
│                                                          │
│  [Submit Feedback]                                       │
└──────────────────────────────────────────────────────────┘
```

**On submit:** Creates `assessmentFeedback` record → creates `consultantNotifications` for admin: "Candidate [name] has submitted feedback on their assessment."

---

## Feature 4.5 — Assessment Feedback Review (Admin Side)

### [MODIFY] Assessment detail page (`/dashboard/assessments/[id]`)

Add a section at the bottom:

```
Candidate Feedback Submissions

  [Date]  "I felt the video interview didn't capture my actual experience..."
  Status: [Under Review]    Reviewed by: [name]
  Internal Notes: [textarea]
  [Mark as Reviewed]
```

Admins can read + mark resolved. This does NOT modify the actual assessment.

---

## Feature 4.6 — Client Portal: Full Report View

### [MODIFY] `src/features/client/components/ClientCandidateProfile.tsx`

When `assessments.fullReportSharedWithClient = true`, add an **"Assessment Report"** tab.

Show the full structured report (from `assessments.fullReport`) in read-only rich text format.

- If no report shared: "The assessment report for this candidate has not been shared yet."

---

## File Manifest

### New Files
| Path | Type |
|---|---|
| `src/db/migrations/0029_candidate_portal_phase4.sql` | SQL Migration |
| `src/app/dashboard/assessments/page.tsx` | Page (MK OS) |
| `src/app/dashboard/assessments/[id]/page.tsx` | Page (MK OS detail) |
| `src/app/candidate/assessment/page.tsx` | Page (candidate portal) |
| `src/app/candidate/assessment/feedback/page.tsx` | Page (candidate portal) |
| `src/features/assessments/components/AssessmentsListClient.tsx` | Component (MK OS) |
| `src/features/assessments/components/AssessmentDetailClient.tsx` | Component (MK OS) |
| `src/features/candidate-portal/components/AssessmentClient.tsx` | Component (candidate) |
| `src/actions/assessments.ts` | Server Actions |

### Modified Files
| Path | Change |
|---|---|
| `src/db/schema.ts` | New `assessments` + `assessmentFeedback` tables; new columns on `candidates` |
| `src/features/candidates/components/FlCandidateClient.tsx` | Assessment tab + badge |
| `src/features/client/components/ClientCandidateProfile.tsx` | Assessment Report tab |
| `src/actions/candidate-portal.ts` | Add `submitCandidateFeedback` |
| `src/components/shared/Sidebar.tsx` | Add `/candidate/assessment` to candidate nav |

---

## Build Order

1. DB migration → update schema.ts
2. `src/actions/assessments.ts`
3. Assessments list page (MK OS)
4. Assessment detail page (MK OS) — hardest component
5. Wire into candidate detail as a tab
6. Candidate assessment view (candidate portal)
7. Candidate feedback form
8. Admin feedback review (in assessment detail)
9. Client report view

---

## Testing Checklist

- [ ] Consultant can create an assessment and set Step 1 scheduled date
- [ ] Step status can be updated per step independently
- [ ] Full report is NOT visible in candidate portal under any circumstance
- [ ] Candidate pointers capped at 3 (UI prevents adding a 4th)
- [ ] Pointers shown to candidate with no score or tier information
- [ ] Publishing sets `isMkAssessed = true` + `assessmentScoreTier` on `candidates`
- [ ] Publishing creates `candidateNotifications` for the candidate
- [ ] Candidate can submit feedback — does not modify assessment
- [ ] Admin sees candidate feedback in assessment detail
- [ ] Full report visible in client portal ONLY when `fullReportSharedWithClient = true`
- [ ] Candidate portal shows correct state (Not Scheduled / In Progress / Published)
- [ ] Timeline shows correct step completions
- [ ] Assessment badge on candidate pipeline rows
