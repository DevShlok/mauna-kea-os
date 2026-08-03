# Phase 3 — Detailed Implementation Plan
## Jobs Page & Dream Companies Tracker

> **Priority:** P2  
> **Timeline Estimate:** 2 weeks  
> **Dependency:** Phase 1 complete (candidate portal structure in place)

---

## Overview

Phase 3 builds two independent but related features:

1. **Curated Jobs Feed** — A LinkedIn-style curated job discovery page. Jobs are manually added and curated by consultants (not a job board). Candidate marks interest or disinterest.

2. **Dream Companies Tracker** — Candidate lists up to 10 dream companies. The platform tracks representation status per company (from `Not Started` through `Offer`). Includes a smart suggestion engine that surfaces similar companies based on candidate's profile, experience history, and aspirations.

---

## DB Schema Changes (Migration)

### New Tables — `src/db/schema.ts`

```typescript
// ─── CURATED JOBS ────────────────────────────────────────────────
export const candidateJobs = pgTable('candidate_jobs', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  companyDisplay: varchar('company_display', { length: 255 }),
  // Can be "A Leading FMCG Company" (confidential) or real name
  isConfidential: boolean('is_confidential').default(false),
  location: varchar('location', { length: 255 }),
  ctcRangeMin: int('ctc_range_min'),    // in lakhs
  ctcRangeMax: int('ctc_range_max'),
  experienceMin: int('experience_min'), // years
  experienceMax: int('experience_max'),
  sector: varchar('sector', { length: 255 }),
  description: text('description'),
  highlights: json('highlights').$type<string[]>().default([]),
  // Key bullet points shown on card
  isActive: boolean('is_active').default(true),
  targetCandIds: json('target_cand_ids').$type<string[]>().default([]),
  // Optional: if empty, show to all candidates; if set, only to these candidates
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
  expiresAt: datetime('expires_at'),
}, (table) => ({
  isActiveIdx: index('cj_is_active_idx').on(table.isActive),
  sectorIdx: index('cj_sector_idx').on(table.sector),
}));

// ─── JOB INTEREST SIGNALS ────────────────────────────────────────
export const candidateJobInterests = pgTable('candidate_job_interests', {
  id: serial('id').primaryKey(),
  jobId: int('job_id').notNull().references(() => candidateJobs.id),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  status: varchar('status', { length: 50 }).default('Shown'),
  // Shown | Interested | Not Interested
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  jobCandUnique: unique('cji_job_cand_unique').on(table.jobId, table.candId),
  candIdIdx: index('cji_cand_id_idx').on(table.candId),
}));

// ─── DREAM COMPANY STATUS ────────────────────────────────────────
export const dreamCompanyStatus = pgTable('dream_company_status', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('Not Started'),
  // Not Started | Outreach Sent | In Talks | Interviewed | Rejected | Offer
  notes: text('notes'), // internal consultant notes — NOT shown to candidate
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: datetime('updated_at').default(sql`now()`),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('dcs_cand_id_idx').on(table.candId),
}));
```

### Migration file — `src/db/migrations/0028_candidate_portal_phase3.sql`
```sql
CREATE TABLE IF NOT EXISTS candidate_jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company_display VARCHAR(255),
  is_confidential BOOLEAN DEFAULT false,
  location VARCHAR(255),
  ctc_range_min INT,
  ctc_range_max INT,
  experience_min INT,
  experience_max INT,
  sector VARCHAR(255),
  description TEXT,
  highlights JSON DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  target_cand_ids JSON DEFAULT '[]',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_job_interests (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL REFERENCES candidate_jobs(id),
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id),
  status VARCHAR(50) DEFAULT 'Shown',
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(job_id, cand_id)
);

CREATE TABLE IF NOT EXISTS dream_company_status (
  id SERIAL PRIMARY KEY,
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id),
  company_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Not Started',
  notes TEXT,
  updated_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);
```

---

## Feature 3.1 — Curated Jobs Feed

### [NEW] `src/app/candidate/jobs/page.tsx`
### [NEW] `src/features/candidate-portal/components/JobsClient.tsx`

**Server data fetch:**
```typescript
// Fetch active jobs — either targeted at this candidate or available to all
const jobs = await db.select().from(candidateJobs)
  .where(and(
    eq(candidateJobs.isActive, true),
    or(
      sql`${candidateJobs.targetCandIds} = '[]'::json`,  // available to all
      sql`${candidateJobs.targetCandIds}::text LIKE ${'%' + linkedCandidateId + '%'}`
    )
  ))
  .orderBy(desc(candidateJobs.createdAt));

// Fetch this candidate's existing interest signals
const interests = await db.select().from(candidateJobInterests)
  .where(eq(candidateJobInterests.candId, linkedCandidateId));
```

**Job Card UI:**
```
┌──────────────────────────────────────────────────────────┐
│  CFO – A Leading FMCG Company                🔒 Confidential │
│  📍 Gurgaon   💼 20–25 years   💰 ₹1.5–2 Cr              │
│  🏷️  FMCG · Consumer Goods                              │
│                                                          │
│  ✦ P&L ownership of ₹3,000 Cr+ business                 │
│  ✦ Direct report to Group MD                             │
│  ✦ India HQ + international exposure preferred           │
│                                                          │
│  [✓ I'm Interested]  [✗ Not for me]                      │
└──────────────────────────────────────────────────────────┘
```

**Confidential mode:** When `isConfidential = true`, show `companyDisplay` (e.g., "A Leading FMCG Company") — never show real company name.

**Interest buttons:**
- "I'm Interested" → upserts `candidateJobInterests` with `status = 'Interested'` → notifies consultant
- "Not for me" → upserts with `status = 'Not Interested'`
- After selection: button state updates optimistically

**Filters:**
- Filter by sector
- Filter by location
- Filter by CTC range (slider or presets: < 50L / 50L–1Cr / 1Cr+)

### [NEW] `src/actions/candidate-portal.ts` — add:
```typescript
export async function markJobInterestAction(jobId: number, candId: string, status: 'Interested' | 'Not Interested') { ... }
```

On `Interested`: also create `consultantNotifications` — "Candidate [name] has expressed interest in job: [title]."

---

## Feature 3.2 — Job Curation Tool (MK OS)

### [NEW] `src/app/dashboard/candidate-jobs/page.tsx`
### [NEW] `src/features/candidate-portal/admin/JobsCurationClient.tsx`

**Consultant tool:**

**List view:**
- Table of all jobs (active/inactive)
- Per-row: Title, Company Display, Sector, Created, Responses count (Interested / Not Interested)
- Toggle Active/Inactive inline
- Click row → Edit modal

**Create/Edit modal:**
- Title (required)
- Company Display (text — what candidates see)
- Is Confidential (toggle)
- Location
- CTC Range (min/max, in lakhs)
- Experience Range (min/max years)
- Sector (dropdown from master sectors)
- Description (rich textarea)
- Highlights (dynamic list of bullet points — add/remove)
- Targeted candidates (optional multi-select — if empty, all candidates see it)
- Expiry date (optional)

**Interest analytics view:**
- Per job: list of candidates who said "Interested" (with links to profiles)
- List of candidates who said "Not Interested"

### Actions — `src/actions/candidate-jobs.ts`
```typescript
export async function createJobAction(data: {...}) { ... }
export async function updateJobAction(id: number, data: {...}) { ... }
export async function toggleJobActiveAction(id: number, isActive: boolean) { ... }
export async function getJobInterestsAction(jobId: number) { ... }
```

---

## Feature 3.3 — Dream Companies Tracker (Candidate)

### [NEW] `src/app/candidate/dream-companies/page.tsx`
### [NEW] `src/features/candidate-portal/components/DreamCompaniesClient.tsx`

**Server data fetch:**
```typescript
// Current dream companies from candidates.dreamCos
const candidate = await getCandidateById(linkedCandidateId);
const dreamCos = candidate.dreamCos ?? [];

// Status per company
const statuses = await db.select().from(dreamCompanyStatus)
  .where(eq(dreamCompanyStatus.candId, linkedCandidateId));

// Suggested companies (from suggestion engine — see 3.4 below)
const suggestions = await getSuggestedCompanies(linkedCandidateId);
```

**Dream Companies UI:**

```
┌───────────────────────────────────────────────────────────────┐
│  ⭐  My Dream Companies            [+ Add Company]            │
│                                                               │
│  We'll make our best effort to represent you at these        │
│  companies — at no charge.                                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1.  Hindustan Unilever Limited                     │    │
│  │      🔵 Outreach Sent — "We've reached out to HR"   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  2.  Marico Limited                                  │    │
│  │      ⚪ Not Started — "We'll make a best effort"    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  3.  Godrej Consumer Products                        │    │
│  │      🟢 Offer Received 🎉                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Maximum 10 companies · 3 of 10 selected                     │
├───────────────────────────────────────────────────────────────┤
│  💡 Suggested for you (based on your profile)                 │
│                                                               │
│  [Nestlé India]  [ITC Limited]  [Dabur India]  [+ more]     │
│  "Similar to companies in your background"                    │
└───────────────────────────────────────────────────────────────┘
```

**Status color coding:**
| Status | Color | Message |
|---|---|---|
| Not Started | ⚪ Gray | "We'll make a best effort to reach out" |
| Outreach Sent | 🔵 Blue | "We've reached out to HR at this company" |
| In Talks | 🟡 Yellow | "Conversations are ongoing" |
| Interviewed | 🟠 Orange | "You've been put forward for an interview" |
| Rejected | 🔴 Red | "This didn't progress this time" |
| Offer | 🟢 Green | "Congratulations! 🎉" |

**Add Company flow:**
- Click "+ Add Company" → opens a search modal
- Search field: searches `masterClients` table + free text
- Shows suggestions from Phase 3.4 suggestion engine
- On select: adds to `candidates.dreamCos` (JSON array) and creates `dreamCompanyStatus` record with `Not Started`
- Limit: 10 companies enforced with warning

**Remove Company:** "×" button on each card → removes from `dreamCos` + deletes `dreamCompanyStatus` record

**Actions — `src/actions/candidate-portal.ts`:**
```typescript
export async function addDreamCompanyAction(candId: string, companyName: string) { ... }
export async function removeDreamCompanyAction(candId: string, companyName: string) { ... }
```

---

## Feature 3.4 — Dream Company Suggestion Engine

> This is the "similar companies" suggestion engine requested in the BRD comments. No AI — rule-based matching in Phase 3.

### [NEW] `src/lib/dreamCompanySuggestions.ts`

**Logic:**
```typescript
export async function getSuggestedCompanies(candId: string): Promise<string[]> {
  const candidate = await getCandidateById(candId);
  
  const signal = {
    pastCompanies: candidate.pastCompanies ?? [],
    currentCompany: candidate.company,
    expTags: candidate.expTags ?? [],    // sector/industry tags
    designation: candidate.designation,
  };
  
  // Step 1: Find similar companies from masterClients by:
  // - Same industry as candidate's expTags
  // - Sector match to candidate's current/past companies
  const byIndustry = await db.select({ companyName: masterClients.companyName })
    .from(masterClients)
    .where(inArray(masterClients.industry, signal.expTags))
    .limit(20);
  
  // Step 2: Find companies similar to current/past companies
  // (Using the masterClients table — match by industry of known companies)
  const candidateCompanyIndustries = await db.select({ industry: masterClients.industry })
    .from(masterClients)
    .where(inArray(masterClients.companyName, [signal.currentCompany, ...signal.pastCompanies]));
  
  const uniqueIndustries = [...new Set(candidateCompanyIndustries.map(c => c.industry).filter(Boolean))];
  
  const bySimilarIndustry = await db.select({ companyName: masterClients.companyName })
    .from(masterClients)
    .where(inArray(masterClients.industry, uniqueIndustries))
    .limit(30);
  
  // Step 3: Deduplicate, exclude already-added dream companies, return top 10
  const alreadyAdded = new Set(candidate.dreamCos ?? []);
  const allSuggestions = [...byIndustry, ...bySimilarIndustry]
    .map(c => c.companyName)
    .filter(Boolean)
    .filter(name => !alreadyAdded.has(name));
  
  return [...new Set(allSuggestions)].slice(0, 10);
}
```

This is a lightweight, rule-based "people like you worked at these companies" approach. No ML or AI required in Phase 3. Phase 5+ can layer in AI scoring.

---

## Feature 3.5 — Dream Company Status Management (Consultant Side)

### [MODIFY] Candidate detail in MK OS (e.g., `FlCandidateClient.tsx`)

Add a **"Dream Companies"** tab:

```
Dream Companies for [Candidate Name]

┌───────────────────────────────────────────────────────────────┐
│  Company Name               Status              Notes          │
├───────────────────────────────────────────────────────────────┤
│  Hindustan Unilever         [Under Review ▼]   [Notes...]      │
│  Marico Limited             [Not Started ▼]    [Notes...]      │
│  Godrej Consumer Products   [Offer ▼]          [Notes...]      │
└───────────────────────────────────────────────────────────────┘
```

- Status dropdown (consultant updates)
- Notes field (free text — internal only, NOT shown to candidate)

**Actions — `src/actions/reference-checks.ts` (or new `dream-companies.ts`):**
```typescript
export async function updateDreamCompanyStatusAction(
  id: number,
  status: string,
  notes: string,
  updatedBy: string
) { ... }
```

**On status change:** Create `candidateNotifications` for candidate:
- "Update on your dream company: [Company Name] → [Status Label]"
- Links to `/candidate/dream-companies`

---

## Premium Program Teaser (Phase 5 Placeholder)

At the bottom of the Dream Companies page, show a locked "Premium Representation" card:

```
┌──────────────────────────────────────────────────────────────┐
│  🔒  Premium Representation Program                          │
│                                                              │
│  Get guaranteed, structured outreach to 10 companies        │
│  with dedicated MK consultant support.                       │
│                                                              │
│  Available to candidates who have completed the MK           │
│  assessment process.                                         │
│                                                              │
│  [Learn More — Coming Soon]                                  │
└──────────────────────────────────────────────────────────────┘
```

This teases Phase 5 without breaking anything in Phase 3.

---

## File Manifest

### New Files
| Path | Type |
|---|---|
| `src/db/migrations/0028_candidate_portal_phase3.sql` | SQL Migration |
| `src/app/candidate/jobs/page.tsx` | Page |
| `src/app/candidate/dream-companies/page.tsx` | Page |
| `src/app/dashboard/candidate-jobs/page.tsx` | Page (MK OS) |
| `src/features/candidate-portal/components/JobsClient.tsx` | Component |
| `src/features/candidate-portal/components/DreamCompaniesClient.tsx` | Component |
| `src/features/candidate-portal/admin/JobsCurationClient.tsx` | Component (MK OS) |
| `src/lib/dreamCompanySuggestions.ts` | Suggestion Engine |
| `src/actions/candidate-jobs.ts` | Server Actions |

### Modified Files
| Path | Change |
|---|---|
| `src/db/schema.ts` | New `candidateJobs`, `candidateJobInterests`, `dreamCompanyStatus` tables |
| `src/actions/candidate-portal.ts` | Add `markJobInterest`, `addDreamCompany`, `removeDreamCompany` |
| `src/features/candidates/components/FlCandidateClient.tsx` | Add Dream Companies tab |

---

## Build Order

1. DB migration → update schema.ts
2. `dreamCompanySuggestions.ts` (no UI — pure logic, testable independently)
3. `src/actions/candidate-jobs.ts`
4. Jobs curation tool (MK OS) — consultants can start adding jobs
5. Jobs feed page (candidate portal)
6. Dream Companies tracker (candidate portal)
7. Dream Company status management (MK OS tab)
8. Status change → candidate notification
9. Premium teaser card

---

## Testing Checklist

- [ ] Confidential jobs show display name only (no real company)
- [ ] Non-confidential jobs show real company name
- [ ] "I'm Interested" creates interest record + consultant notification
- [ ] "Not for me" creates interest record, no notification
- [ ] Job cards only visible if `isActive = true`
- [ ] Targeted jobs only visible to listed `targetCandIds`
- [ ] Dream company max 10 enforced with warning
- [ ] Add company → appears in list with "Not Started"
- [ ] Remove company → removed from list
- [ ] Suggestion engine returns companies from same industry/sector
- [ ] Suggestions exclude already-added dream companies
- [ ] Consultant can update status per company
- [ ] Status change creates `candidateNotifications` record
- [ ] Consultant notes NOT visible to candidate
- [ ] Premium teaser shows on dream companies page
