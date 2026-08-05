# BRD Phase 3 — Consumers of the Rubric Output (Rule-Based)
> **Timeline:** 1 sprint (~1 week) · **Depends on:** Phase 2 complete (tier must exist before gating/filtering on it)  
> **Goal:** Wire three small, rule-based features that all consume the `tier` value from Phase 2: eligibility gating for Dream 10, consultant-curated guidance, and tag-based job recommendation filtering.

---

## Existing Codebase Context

### Tier source (from Phase 2)
```ts
// Read tier from candidateBadges
const badge = await db.select().from(candidateBadges)
  .where(and(eq(candidateBadges.candId, candId), eq(candidateBadges.badgeType, 'assessment_complete')))
  .limit(1);
const tier = badge[0]?.metadata?.tier ?? null; // 'A' | 'B' | 'C' | null
```

### Dream company infrastructure (already built)
- `dreamCompanyStatus` table — tracks per-company status per candidate
- `addDreamCompanyAction` + `removeDreamCompanyAction` in `candidate-portal.ts`
- `DreamCompaniesClient.tsx` — renders dream company cards
- `candidates.dreamCos` (JSON array) — the source list

### Jobs board infrastructure (already built)
- `candidateJobs` table — title, companyDisplay, sector, highlights, ctcRangeMin/Max, experienceMin/Max, `targetCandIds` (JSON array of pre-targeted candidate IDs), `isActive`
- `candidateJobInterests` — interest signals
- `JobsClient.tsx` — renders job cards with interest/apply actions (Phase 1 adds Apply button)

---

## Task 1: Dream 10 Tier Gating

### Business Rule
If `tier = null` (not assessed) or `tier = 'C'`, candidate cannot access Dream 10 tracking. They see a locked state with a message: "Complete your MK Assessment to unlock Dream 10 Executive Tracking."

If `tier = 'A'` or `tier = 'B'`, full access is unlocked.

### Implementation

**File: `src/app/candidate/dream-companies/page.tsx`** (or slug-based route)
- Server-side: fetch the candidate's assessment tier from `candidateBadges`.
- Pass `tier` as prop to `DreamCompaniesClient`.

**File: `src/features/candidate-portal/components/DreamCompaniesClient.tsx`**
- Add prop `tier: 'A' | 'B' | 'C' | null`.
- If `!tier || tier === 'C'`: render a locked state instead of the dream company list:

```tsx
function LockedState() {
  return (
    <div className="max-w-xl mx-auto py-24 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#eef2f7]"
        style={{ boxShadow: '4px 4px 10px #cbd5e1, -4px -4px 10px #ffffff' }}>
        <Lock className="w-8 h-8 text-[#133255]" />
      </div>
      <h2 className="text-slate-800 font-bold text-xl">Dream 10 — Locked</h2>
      <p className="text-slate-500 text-[14px] max-w-sm">
        Complete your Mauna Kea Assessment to unlock Dream 10 Executive Tracking.
        Tier B or above gives you access.
      </p>
    </div>
  );
}
```

- If `tier === 'A' || tier === 'B'`: render existing dream companies list as-is.

### Acceptance Criteria
- Candidate with no assessment or Tier C → sees locked state, cannot add companies
- Candidate with Tier A/B → full access
- Changing tier from C→B (after re-assessment) immediately unlocks access on next page load

---

## Task 2: Consultant-Curated Guidance Notes

### Design
This is a simple `tier + targetRole → content block` lookup. No ML. A consultant writes guidance notes in an admin UI, keyed to a tier and optionally a role category (CFO / CHRO / General).

### New DB Table
**File: `src/db/schema.ts`** — add:
```ts
// ─── GUIDANCE CONTENT BLOCKS (Phase 3) ───────────────────
export const guidanceBlocks = pgTable('guidance_blocks', {
  id: serial('id').primaryKey(),
  tier: varchar('tier', { length: 5 }).notNull(), // 'A' | 'B' | 'C' | '*' (wildcard)
  targetRole: varchar('target_role', { length: 100 }).default('*'), // 'CFO' | 'CHRO' | '*'
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  isActive: boolean('is_active').default(true),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  tierIdx: index('gb_tier_idx').on(table.tier),
  targetRoleIdx: index('gb_target_role_idx').on(table.targetRole),
}));

export type GuidanceBlock = typeof guidanceBlocks.$inferSelect;
```

**Migration:** `ALTER TABLE guidance_blocks ...` — new table, no backfill needed.

### Lookup Logic
Priority order for matching:
1. Exact `tier + targetRole` match
2. `tier + '*'` match
3. `'*' + targetRole` match
4. `'*' + '*'` catch-all

### New File: `src/actions/guidance.ts`
```ts
'use server';
import { db } from '@/db';
import { guidanceBlocks } from '@/db/schema';
import { and, eq, or } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getGuidanceForCandidateAction(tier: string, targetRole: string) {
  // Fetch all active blocks that match tier or wildcard
  const blocks = await db
    .select()
    .from(guidanceBlocks)
    .where(and(
      eq(guidanceBlocks.isActive, true),
      or(eq(guidanceBlocks.tier, tier), eq(guidanceBlocks.tier, '*')),
      or(eq(guidanceBlocks.targetRole, targetRole), eq(guidanceBlocks.targetRole, '*'))
    ));

  // Sort by specificity: exact match > tier-only > role-only > wildcard
  return blocks.sort((a, b) => {
    const scoreA = (a.tier !== '*' ? 2 : 0) + (a.targetRole !== '*' ? 1 : 0);
    const scoreB = (b.tier !== '*' ? 2 : 0) + (b.targetRole !== '*' ? 1 : 0);
    return scoreB - scoreA;
  });
}

export async function upsertGuidanceBlockAction(data: {
  id?: number;
  tier: string;
  targetRole: string;
  title: string;
  body: string;
}) {
  await requireRole(['admin', 'consultant']);
  if (data.id) {
    await db.update(guidanceBlocks).set(data).where(eq(guidanceBlocks.id, data.id));
  } else {
    await db.insert(guidanceBlocks).values({ ...data, isActive: true });
  }
  revalidatePath('/dashboard/guidance');
  revalidatePath('/candidate/guidance');
  return { success: true };
}

export async function deleteGuidanceBlockAction(id: number) {
  await requireRole(['admin']);
  await db.update(guidanceBlocks).set({ isActive: false }).where(eq(guidanceBlocks.id, id));
  revalidatePath('/dashboard/guidance');
  return { success: true };
}
```

### Candidate-Facing Page

**New File: `src/app/candidate/guidance/page.tsx`**
- Server-side: fetch candidate's tier (from `candidateBadges`) and `dreamRoles[0]` as target role.
- Call `getGuidanceForCandidateAction(tier, targetRole)`.
- Render up to 5 guidance blocks as styled cards.
- If no tier: show "Complete your assessment to receive personalised guidance."

**New Component: `src/features/candidate-portal/components/GuidanceClient.tsx`**
- Renders guidance block cards (title + body, expandable).
- Add to `CandidateSidebar.tsx` navigation links.

### Admin Page

**New File: `src/app/dashboard/guidance/page.tsx`**
- Table of all `guidanceBlocks`.
- "Add Block" button → modal with tier dropdown, targetRole dropdown, title, body textarea.
- Delete/deactivate action per row.

---

## Task 3: Tag-Based Job Recommendation Filter

### Design
The jobs board already shows all active `candidateJobs`. This task adds a "Recommended for You" section at the top that filters + ranks jobs by tag overlap between `candidate.expTags` / `candidate.dreamRoles` and `candidateJobs.sector` / `candidateJobs.highlights`.

No ML. Pure set-intersection arithmetic.

### Scoring Formula
```ts
function computeJobMatchScore(candidate: Candidate, job: CandidateJob): number {
  const candTags = new Set([
    ...(candidate.expTags ?? []).map(t => t.toLowerCase()),
    ...(candidate.dreamRoles ?? []).map(t => t.toLowerCase()),
  ]);
  const jobTags = new Set([
    ...(job.highlights ?? []).map(t => t.toLowerCase()),
    job.sector?.toLowerCase() ?? '',
  ]);
  let overlap = 0;
  for (const tag of candTags) {
    if (jobTags.has(tag)) overlap++;
  }
  return overlap;
}
```

### Implementation

**File: `src/features/candidate-portal/components/JobsClient.tsx`**
- Accept new prop `candidateTags: { expTags: string[]; dreamRoles: string[] }`.
- Compute match scores client-side (the data is already passed down, no extra fetch).
- At the top: show "Recommended for You" section — all jobs with `matchScore > 0`, sorted descending by score. Cap at 3.
- Below: "All Opportunities" section — remaining jobs.

**File: `src/app/candidate/jobs/page.tsx`** (server page)
- Additionally fetch `candidate.expTags` and `candidate.dreamRoles` and pass to `JobsClient`.

Also respect `targetCandIds`: if `job.targetCandIds` includes `candId`, the job always appears at the top of recommendations regardless of score.

---

## DB Changes Required

| Table | Change | Type |
|---|---|---|
| `guidance_blocks` | **New table** | Migration: `CREATE TABLE IF NOT EXISTS guidance_blocks ...` |

All other changes are additive queries on existing tables.

**Migration script** (add to `scripts/` or run via Drizzle push):
```sql
CREATE TABLE IF NOT EXISTS guidance_blocks (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(5) NOT NULL,
  target_role VARCHAR(100) DEFAULT '*',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gb_tier_idx ON guidance_blocks(tier);
CREATE INDEX IF NOT EXISTS gb_target_role_idx ON guidance_blocks(target_role);
```

---

## Testing Checklist
- [ ] Tier C candidate → Dream 10 locked state renders
- [ ] Tier B candidate → Dream 10 list renders and add/remove works
- [ ] Admin adds guidance block for `tier=A, targetRole=CFO`
- [ ] Tier A CFO-targeting candidate sees that block at `/candidate/guidance`
- [ ] Tier B non-CFO candidate sees wildcard blocks only
- [ ] Job with matching tags appears in "Recommended for You" section
- [ ] Job in `targetCandIds` for candidate appears at top
- [ ] `npx tsc --noEmit` passes 0 errors
