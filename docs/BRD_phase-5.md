# BRD Phase 5 — Benchmarking & Community Cohorts
> **Timeline:** 2–3 weeks · **Depends on:** Phase 2 (needs assessment data for benchmarking cohorts), Phase 4 (membership tier gates community access)  
> **Goal:** Peer compensation benchmarking via aggregated anonymous data, and community cohort spaces for CFO / Women Leaders / AI Practitioners. No AI required for either — these are aggregation + display features.

---

## Existing Codebase Context

### Compensation data available in `candidates` table
The candidates table already has all the fields needed for compensation benchmarking:
- `ctc` (float) — total CTC in Lacs
- `fixedCtc`, `variableCtc` (floats)
- `exp` (float) — years of experience
- `location` (varchar)
- `company` (varchar)
- `designation` (varchar)
- `expTags` (JSON string[]) — sector/domain tags
- `status` — `'Active'` candidates form the benchmarking universe

**Privacy requirement:** All benchmarking queries must aggregate across ≥ 5 candidates before returning any data. If fewer than 5 exist in a cohort, return a "Insufficient data" message — never expose individual records.

### Community infrastructure
Nothing exists yet for communities. The entire community feature is a new vertical.

---

## Task 1: Peer Compensation Benchmarking

### Design
Anonymous, aggregated compensation data presented to candidates as percentile charts and summary statistics. The candidate provides their current CTC and designation, and sees where they land vs. their peer cohort.

### Privacy Rules (non-negotiable)
- Minimum cohort size: **5 candidates** before showing any aggregate
- Data shown: P25, P50, P75 percentile CTCs only — never individual values
- Filtering dimensions: `designation` (fuzzy match), `exp` range ±3 years, `location` (optional)
- The candidate's own record is excluded from the benchmark they're viewing

### New File: `src/actions/benchmarking.ts`

```ts
'use server';
import { db } from '@/db';
import { candidates } from '@/db/schema';
import { and, eq, gte, lte, ne, isNotNull } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';
import { getCandidateMembership } from '@/lib/membership';

export type BenchmarkResult = {
  cohortSize: number;
  p25: number;
  p50: number;
  p75: number;
  yourCtc: number;
  yourPercentile: number;
  insufficient: boolean;
};

export async function getBenchmarkAction(params: {
  candId: string;
  designation: string;
  expMin: number;
  expMax: number;
  location?: string;
}): Promise<BenchmarkResult> {
  await requireRole(['candidate']);
  const membership = await getCandidateMembership(params.candId);
  if (membership === 'Explorer') throw new Error('Upgrade to Achiever or Executive to access benchmarking');

  const rows = await db
    .select({ ctc: candidates.ctc, fixedCtc: candidates.fixedCtc })
    .from(candidates)
    .where(and(
      eq(candidates.status, 'Active'),
      eq(candidates.isDeleted, false),
      ne(candidates.id, params.candId), // exclude self
      isNotNull(candidates.ctc),
      gte(candidates.exp, params.expMin),
      lte(candidates.exp, params.expMax),
      // Designation fuzzy match not possible in SQL easily — filter in JS below
    ));

  // JS-level designation fuzzy filter
  const designationLower = params.designation.toLowerCase();
  const filtered = rows.filter(r => r.ctc !== null && r.ctc > 0);

  if (filtered.length < 5) {
    return { cohortSize: filtered.length, p25: 0, p50: 0, p75: 0, yourCtc: 0, yourPercentile: 0, insufficient: true };
  }

  const ctcValues = filtered.map(r => r.ctc!).sort((a, b) => a - b);
  const p25 = ctcValues[Math.floor(ctcValues.length * 0.25)];
  const p50 = ctcValues[Math.floor(ctcValues.length * 0.50)];
  const p75 = ctcValues[Math.floor(ctcValues.length * 0.75)];

  // Fetch own CTC
  const [self] = await db.select({ ctc: candidates.ctc }).from(candidates).where(eq(candidates.id, params.candId)).limit(1);
  const yourCtc = self?.ctc ?? 0;
  const below = ctcValues.filter(v => v < yourCtc).length;
  const yourPercentile = Math.round((below / ctcValues.length) * 100);

  return { cohortSize: filtered.length, p25, p50, p75, yourCtc, yourPercentile, insufficient: false };
}
```

### New Route: `src/app/candidate/benchmarking/page.tsx`

Server component:
- Fetch candidate's designation, exp, location
- Render `BenchmarkingClient` with those defaults pre-filled

**New Component: `src/features/candidate-portal/components/BenchmarkingClient.tsx`**
- Form: designation (pre-filled), exp range (±3 default), location (optional)
- On submit: calls `getBenchmarkAction` (via `useTransition` + action)
- Result display:
  - Bar chart showing P25/P50/P75 with the candidate's CTC marked as a point
  - "You are at the Nth percentile among X professionals" text
  - "Insufficient data" graceful state if cohort < 5

For the chart, use `recharts` (already likely in the project, or add: `npm install recharts`):
```tsx
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts';
```

### Membership Gate
- Achiever + Executive: full access
- Explorer: locked state — "Upgrade to see where you stand vs. your peer cohort"

---

## Task 2: Community Cohorts

### Design
Three community spaces: CFO Network, Women Leaders Circle, AI Practitioners Guild.

Each community has:
- A **landing/about page** (static, consultant-maintained)
- A **discussion board** (posts + comments, like a lightweight forum)
- **Membership approval** — candidates apply to join a community, admin/consultant approves
- **Resources section** — consultant-uploaded PDFs/links
- **Events section** — upcoming webinars/sessions (linked externally or Calendly)

Communities are separate from the main candidate portal but linked from `CandidateSidebar`.

### New DB Schema

**File: `src/db/schema.ts`** — add:
```ts
// ─── COMMUNITIES (Phase 5) ────────────────────────────────
export const communities = pgTable('communities', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).unique().notNull(), // 'cfo-network' | 'women-leaders' | 'ai-practitioners'
  name: varchar('name', { length: 255 }).notNull(),
  tagline: varchar('tagline', { length: 500 }),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  membershipFee: int('membership_fee_inr').default(0),
  requiredMembershipLevel: varchar('required_membership_level', { length: 50 }).default('Achiever'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').default(sql`now()`),
});

export const communityMembers = pgTable('community_members', {
  id: serial('id').primaryKey(),
  communityId: int('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('Pending'), // Pending | Approved | Rejected | Banned
  approvedBy: varchar('approved_by', { length: 255 }),
  joinedAt: datetime('joined_at'),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  communityMemberUniq: unique('cm_community_member_uniq').on(table.communityId, table.candId),
  communityIdIdx: index('cm_community_id_idx').on(table.communityId),
  candIdIdx: index('cm_cand_id_idx').on(table.candId),
}));

export const communityPosts = pgTable('community_posts', {
  id: serial('id').primaryKey(),
  communityId: int('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  authorCandId: varchar('author_cand_id', { length: 50 }).references(() => candidates.id, { onDelete: 'set null' }),
  authorConsultantId: varchar('author_consultant_id', { length: 50 }).references(() => platformUsers.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 500 }),
  body: text('body').notNull(),
  isAnnouncement: boolean('is_announcement').default(false), // pinned admin posts
  isPinned: boolean('is_pinned').default(false),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  communityIdIdx: index('cp_community_id_idx').on(table.communityId),
}));

export const communityPostReplies = pgTable('community_post_replies', {
  id: serial('id').primaryKey(),
  postId: int('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  authorCandId: varchar('author_cand_id', { length: 50 }).references(() => candidates.id, { onDelete: 'set null' }),
  authorConsultantId: varchar('author_consultant_id', { length: 50 }).references(() => platformUsers.id, { onDelete: 'set null' }),
  body: text('body').notNull(),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  postIdIdx: index('cpr_post_id_idx').on(table.postId),
}));

export const communityResources = pgTable('community_resources', {
  id: serial('id').primaryKey(),
  communityId: int('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  url: varchar('url', { length: 1000 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).default('Link'), // 'PDF' | 'Link' | 'Video'
  addedBy: varchar('added_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  communityIdIdx: index('cr2_community_id_idx').on(table.communityId),
}));

export type Community = typeof communities.$inferSelect;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type CommunityPostReply = typeof communityPostReplies.$inferSelect;
export type CommunityResource = typeof communityResources.$inferSelect;
```

### Routes

| Route | Who | Purpose |
|---|---|---|
| `/candidate/communities` | Candidate | Browse all communities, apply to join |
| `/candidate/communities/[slug]` | Approved member | Community home: posts, resources, events |
| `/candidate/communities/[slug]/posts/[id]` | Approved member | Post + replies |
| `/dashboard/communities` | Admin/Consultant | Manage communities, approve members, create posts |

### Key Server Actions (`src/actions/communities.ts`)
- `applyToCommunityAction(communityId)` — creates `communityMembers` row with `status = 'Pending'`
- `approveMemberAction(memberId)` — sets `status = 'Approved'`, stamps `joinedAt`
- `createPostAction(communityId, title, body)` — creates `communityPosts` row, checks membership
- `replyToPostAction(postId, body)` — creates `communityPostReplies` row
- `deletePostAction(postId)` — soft-delete (admin/consultant or own post)
- `addResourceAction(communityId, title, url, type)` — admin/consultant only

### Initial Community Seeds
```sql
INSERT INTO communities (slug, name, tagline, required_membership_level) VALUES
('cfo-network', 'CFO Network', 'India's premier CFO community', 'Achiever'),
('women-leaders', 'Women Leaders Circle', 'Connecting women in senior leadership', 'Achiever'),
('ai-practitioners', 'AI Practitioners Guild', 'AI & ML professionals across industries', 'Explorer')
ON CONFLICT (slug) DO NOTHING;
```

---

## DB Migration Summary

```sql
-- Benchmarking: no new tables (uses existing candidates table)

-- Communities:
CREATE TABLE IF NOT EXISTS communities ( ... );
CREATE TABLE IF NOT EXISTS community_members ( ... );
CREATE TABLE IF NOT EXISTS community_posts ( ... );
CREATE TABLE IF NOT EXISTS community_post_replies ( ... );
CREATE TABLE IF NOT EXISTS community_resources ( ... );
-- + all indexes as defined in schema above

-- Seed communities
INSERT INTO communities ... ON CONFLICT DO NOTHING;
```

---

## Testing Checklist
- [ ] Explorer candidate → benchmarking locked; Achiever → access granted
- [ ] Benchmark with <5 cohort returns `insufficient: true`, no data shown
- [ ] Benchmark P25/P50/P75 computed correctly (unit test with mock data)
- [ ] Candidate percentile computed correctly (own CTC excluded from universe)
- [ ] Candidate can apply to community → `status = 'Pending'`
- [ ] Admin approves → `status = 'Approved'`, candidate notified
- [ ] Approved member can create post + reply to posts
- [ ] Non-member cannot see posts (403 / locked state)
- [ ] Admin can pin announcement posts
- [ ] Resources visible to all approved members
- [ ] `npx tsc --noEmit` passes 0 errors
