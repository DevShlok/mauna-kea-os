# Phase 2 — Detailed Implementation Plan
## Reference Checks & Verification Badges

> **Priority:** P1  
> **Timeline Estimate:** 2–3 weeks  
> **Dependency:** Phase 1 must be complete (candidate portal navigation + profile view in place)

---

## Overview

Phase 2 builds the full reference check module with role-differentiated visibility:
- **Consultant:** Full detail — all referee names, companies, verbatim responses, and structured summary
- **Client:** Filtered view — only checks explicitly shared by the consultant, per candidate
- **Candidate:** Constructive, anonymized view — no names, no raw text; only positives / areas to improve / neutral observations

It also introduces the **Verified Badge** system — a double-tick shield icon that appears once a candidate has passed the full reference check process. This badge propagates across the mandate pipeline, client portal, and candidate portal.

---

## DB Schema Changes (Migration)

### New Tables — `src/db/schema.ts`

```typescript
// ─── REFERENCE CHECKS ───────────────────────────────────────────
export const referenceChecks = pgTable('reference_checks', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  conductedBy: varchar('conducted_by', { length: 255 }), // MK team member name
  refereeName: varchar('referee_name', { length: 255 }), // stored internally, never shown to candidate
  refereeRelationship: varchar('referee_relationship', { length: 100 }),
  // 'Peer' | 'Senior' | 'Reportee' | 'Client' | 'Cross-functional'
  refereeCompany: varchar('referee_company', { length: 255 }),
  status: varchar('status', { length: 50 }).default('In Progress'),
  // In Progress | Completed | Verified
  responses: json('responses').$type<Record<string, string>>().default({}),
  // The 10 standardized Q&A pairs: { "Q1": "answer...", "Q2": "answer..." }
  summaryPositives: text('summary_positives'),     // consultant fills after reading raw responses
  summaryImprovements: text('summary_improvements'),
  summaryNeutral: text('summary_neutral'),
  isSharedWithClient: boolean('is_shared_with_client').default(false),
  // Consultant controls this toggle per check per candidate
  isVerified: boolean('is_verified').default(false),
  verifiedAt: datetime('verified_at'),
  verifiedBy: varchar('verified_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('rc_cand_id_idx').on(table.candId),
  statusIdx: index('rc_status_idx').on(table.status),
}));

// ─── CANDIDATE VERIFICATION STATUS ──────────────────────────────
export const candidateVerifications = pgTable('candidate_verifications', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).unique().notNull().references(() => candidates.id),
  status: varchar('status', { length: 50 }).default('Not Started'),
  // Not Started | In Progress | Verified
  badgeLevel: varchar('badge_level', { length: 50 }).default('none'),
  // none | partial | full
  verifiedAt: datetime('verified_at'),
  verifiedBy: varchar('verified_by', { length: 255 }), // consultant/admin who marked verified
  createdAt: datetime('created_at').default(sql`now()`),
  updatedAt: datetime('updated_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('cv_cand_id_idx').on(table.candId),
}));
```

### New types
```typescript
export type ReferenceCheck = typeof referenceChecks.$inferSelect;
export type CandidateVerification = typeof candidateVerifications.$inferSelect;
```

### Migration file — `src/db/migrations/0027_candidate_portal_phase2.sql`
```sql
CREATE TABLE IF NOT EXISTS reference_checks (
  id SERIAL PRIMARY KEY,
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id),
  conducted_by VARCHAR(255),
  referee_name VARCHAR(255),
  referee_relationship VARCHAR(100),
  referee_company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'In Progress',
  responses JSON DEFAULT '{}',
  summary_positives TEXT,
  summary_improvements TEXT,
  summary_neutral TEXT,
  is_shared_with_client BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidate_verifications (
  id SERIAL PRIMARY KEY,
  cand_id VARCHAR(50) UNIQUE NOT NULL REFERENCES candidates(id),
  status VARCHAR(50) DEFAULT 'Not Started',
  badge_level VARCHAR(50) DEFAULT 'none',
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rc_cand_id_idx ON reference_checks(cand_id);
CREATE INDEX IF NOT EXISTS cv_cand_id_idx ON candidate_verifications(cand_id);
```

---

## Reference Question Master List

### [NEW] `src/lib/referenceQuestions.ts`

10 standardized questions used for every reference check:

```typescript
export const REFERENCE_QUESTIONS = [
  "How long have you known [candidate] and in what capacity?",
  "How would you describe [candidate]'s leadership style and impact on the team?",
  "What are [candidate]'s three most distinctive professional strengths?",
  "Can you describe a specific situation where [candidate] demonstrated exceptional judgment or decision-making?",
  "In what areas do you think [candidate] has the most room for growth?",
  "How does [candidate] handle pressure, ambiguity, or conflict?",
  "Would you describe [candidate] as a strategic thinker or an execution-focused leader — or both?",
  "How effective is [candidate] at building relationships with stakeholders, peers, and teams?",
  "Would you hire or work with [candidate] again? Why or why not?",
  "Is there anything else you'd like to share about [candidate] that would be relevant for a senior leadership role?"
];
```

---

## Feature 2.1 — Reference Check Management (Consultant / MK OS)

### [NEW] `src/app/dashboard/candidates/[id]/reference-checks/page.tsx`

Or add as a tab in the existing candidate detail view. This is the internal tool for MK consultants to manage the full reference check process.

### [NEW] `src/features/candidates/components/ReferenceCheckPanel.tsx`

**UI sections:**

**A — Overall Verification Status:**
```
┌──────────────────────────────────────────────────────┐
│  Verification Status:  [ In Progress ▼ ]             │
│  Verified by: [your name]  at [datetime]             │
│  [ Mark as Fully Verified ]                          │
└──────────────────────────────────────────────────────┘
```

**B — Add New Reference Check:**
```
[ + Add Reference Check ]
```

Opens a form:
- Referee Name (text — internal only, never shown to candidate)
- Referee Relationship (dropdown: Peer / Senior / Reportee / Client / Cross-functional)
- Referee Company (text)
- Conducted By (pre-filled with logged-in user's name)
- Status (In Progress / Completed)
- 10-question response form (expandable accordion, one Q per section)
- Summary section (3 textareas: Positives / Areas to Improve / Neutral)
- "Share with Client" toggle
- Save

**C — Existing Reference Checks List:**
Each check shown as a card:
- Referee relationship (not name) as header
- Status badge
- Summary preview (truncated)
- "Share with Client" toggle (inline)
- Edit / Delete actions

**Actions — `src/actions/reference-checks.ts`:**
```typescript
export async function createReferenceCheckAction(data: {...}) { ... }
export async function updateReferenceCheckAction(id: number, data: {...}) { ... }
export async function deleteReferenceCheckAction(id: number) { ... }
export async function toggleClientShareAction(id: number, isShared: boolean) { ... }
export async function markCandidateVerifiedAction(candId: string, verifiedBy: string) { ... }
```

**On `markCandidateVerifiedAction`:**
1. Upsert `candidateVerifications` record: `status = 'Verified'`, `badgeLevel = 'full'`
2. Create `candidateNotifications`: "Your profile has been Verified! A verification badge has been added to your profile."

---

## Feature 2.2 — Candidate Portal: Verification Detail View

### [MODIFY] `src/app/candidate/verification/page.tsx`
### [MODIFY] `src/features/candidate-portal/components/VerificationStatusClient.tsx`

Replace the Phase 1 skeleton with real data.

**Data fetch:**
```typescript
const verification = await db.select().from(candidateVerifications)
  .where(eq(candidateVerifications.candId, linkedCandidateId))
  .limit(1);

const checks = await db.select({
  id: referenceChecks.id,
  refereeRelationship: referenceChecks.refereeRelationship,
  summaryPositives: referenceChecks.summaryPositives,
  summaryImprovements: referenceChecks.summaryImprovements,
  summaryNeutral: referenceChecks.summaryNeutral,
  status: referenceChecks.status,
}).from(referenceChecks)
.where(and(
  eq(referenceChecks.candId, linkedCandidateId),
  eq(referenceChecks.status, 'Completed') // only show completed checks
));
// NOTE: referee_name and referee_company are NEVER selected for candidate view
```

**Candidate UI:**

```
┌──────────────────────────────────────────────────────────┐
│  🛡️  My Verification                                     │
│                                                          │
│  ✅  Fully Verified    (or)    🔄  In Progress           │
│                                                          │
│  What your professional network says about you:          │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Peer 1 · Senior                                  │  │
│  │  ✅  Strong financial acumen and board presence.  │  │
│  │  🔁  Can delegate more to the team.               │  │
│  │  💬  Adapts well to ambiguity.                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Peer 2 · Reportee                                │  │
│  │  ✅  Great mentor and trusted leader.             │  │
│  │  🔁  Sometimes over-prioritizes speed over depth. │  │
│  │  💬  Solid relationship-builder.                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  This feedback is shared constructively to help you      │
│  understand your professional brand.                     │
└──────────────────────────────────────────────────────────┘
```

**Rules:**
- Referee labels: "Peer 1", "Peer 2", "Senior 1", "Reportee 1" (auto-numbered by relationship type)
- `refereeName` and `refereeCompany` are NEVER in the query for this view
- Only show checks where `status = 'Completed'`
- If no completed checks: "Reference checks are being arranged. You'll see feedback here once complete."

---

## Feature 2.3 — Client Portal: Filtered Verification View

### [MODIFY] `src/features/client/components/ClientCandidateProfile.tsx`

Add a new **"Verification"** tab alongside existing tabs.

**Data fetch:**
```typescript
const checks = await db.select({
  id: referenceChecks.id,
  refereeRelationship: referenceChecks.refereeRelationship,
  refereeCompany: referenceChecks.refereeCompany, // clients CAN see company (not name)
  summaryPositives: referenceChecks.summaryPositives,
  summaryImprovements: referenceChecks.summaryImprovements,
  summaryNeutral: referenceChecks.summaryNeutral,
  status: referenceChecks.status,
  isVerified: referenceChecks.isVerified,
}).from(referenceChecks)
.where(and(
  eq(referenceChecks.candId, candId),
  eq(referenceChecks.isSharedWithClient, true), // only consultant-approved checks
  eq(referenceChecks.status, 'Completed')
));
```

**Client UI:** Same structure as candidate view, but:
- Shows referee's **company** (without name) — e.g., "Peer · Ex-ITC Limited"
- Shows the same Positives / Improvements / Neutral sections
- Shows the Verified badge prominently if `candidateVerifications.badgeLevel = 'full'`

If no checks are shared: "The consultant has not yet shared reference check details for this candidate."

---

## Feature 2.4 — Verified Badge Component

### [MODIFY] `src/components/ui/StatusBadge.tsx`

Add a reusable `VerifiedBadge` component:
```typescript
export function VerifiedBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  // Shield icon with double-tick
  // size variants: sm (16px, inline), md (24px, card), lg (40px, profile header)
  return (
    <div className="relative inline-flex items-center justify-center">
      <Shield ... />  {/* filled blue/teal shield */}
      <CheckCheck ... />  {/* double checkmark overlay */}
    </div>
  );
}
```

### Apply `VerifiedBadge` across the app:

| Location | Where |
|---|---|
| Candidate profile header | `CandidateProfileView.tsx` |
| Client candidate card | `ClientDashboard.tsx` shortlist rows |
| Client candidate profile header | `ClientCandidateProfile.tsx` |
| Mandate pipeline row | `MandateDetailClient.tsx` candidate rows |
| Candidate home dashboard | `CandidateHome.tsx` welcome header |

**Data source for badge:** Join `candidateVerifications` on `candId`, check `status = 'Verified'`.

For the mandate pipeline (which already has `mandateCandidates` data), the verification status should be fetched alongside each candidate in the page-level server component.

---

## Feature 2.5 — Propagating Verified Badge to Mandate Pipeline

### [MODIFY] `src/app/dashboard/mandates/[id]/page.tsx` (or similar server component)

When fetching candidates for the mandate, also join verification status:
```typescript
const candidatesWithVerification = await db
  .select({
    ...mandateCandidates,
    ...candidates,
    isVerified: candidateVerifications.status,
  })
  .from(mandateCandidates)
  .leftJoin(candidates, eq(mandateCandidates.candId, candidates.id))
  .leftJoin(candidateVerifications, eq(mandateCandidates.candId, candidateVerifications.candId))
  .where(eq(mandateCandidates.mandateId, mandateId));
```

Pass `isVerified` down to `MandateDetailClient` → show badge on candidate rows.

---

## File Manifest

### New Files
| Path | Type |
|---|---|
| `src/db/migrations/0027_candidate_portal_phase2.sql` | SQL Migration |
| `src/lib/referenceQuestions.ts` | Constants |
| `src/app/dashboard/candidates/[id]/reference-checks/page.tsx` | Page |
| `src/features/candidates/components/ReferenceCheckPanel.tsx` | Component |
| `src/actions/reference-checks.ts` | Server Actions |

### Modified Files
| Path | Change |
|---|---|
| `src/db/schema.ts` | New `referenceChecks` and `candidateVerifications` tables |
| `src/app/candidate/verification/page.tsx` | Replace skeleton with real data |
| `src/features/candidate-portal/components/VerificationStatusClient.tsx` | Full UI with real checks |
| `src/features/client/components/ClientCandidateProfile.tsx` | New Verification tab |
| `src/components/ui/StatusBadge.tsx` | Add `VerifiedBadge` component |
| `src/features/client/components/ClientDashboard.tsx` | Add badge to candidate cards |
| `src/features/mandates/components/MandateDetailClient.tsx` | Add badge to pipeline rows |
| `src/features/candidate-portal/components/CandidateProfileView.tsx` | Badge in header |
| `src/app/dashboard/mandates/[id]/page.tsx` | Join verification in data fetch |

---

## Build Order

1. DB migration → update schema.ts
2. `referenceQuestions.ts` constants
3. `src/actions/reference-checks.ts` (all CRUD actions)
4. `ReferenceCheckPanel` (MK OS side — internal tool)
5. Wire panel into candidate detail page
6. `VerifiedBadge` component
7. Update `CandidateVerifications` view (candidate portal)
8. Update `ClientCandidateProfile` (client portal)
9. Propagate badge to mandate pipeline
10. Propagate badge to client dashboard candidate cards

---

## Testing Checklist

- [ ] Consultant can create a reference check with all 10 questions
- [ ] Consultant can fill summary (Positives / Improvements / Neutral)
- [ ] "Share with Client" toggle works per check
- [ ] Mark Verified creates `candidateVerifications` record + notifies candidate
- [ ] Candidate sees ONLY completed checks, NO referee names or companies
- [ ] Candidate sees "Peer 1", "Senior 1" labels (not real names)
- [ ] Client sees only `isSharedWithClient = true` checks
- [ ] Client sees referee company but not name
- [ ] VerifiedBadge appears correctly in: profile, client dashboard, mandate pipeline
- [ ] Badge only shows when `candidateVerifications.status = 'Verified'`
- [ ] Non-verified candidate has no badge anywhere
