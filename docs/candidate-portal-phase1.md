# Phase 1 — Detailed Implementation Plan
## Core Skeleton + Interview Feedback Loop + Know Your MK Partner

> **Priority:** P1 — Build First  
> **Timeline Estimate:** 3–4 weeks  
> **Dependency:** None — this is the foundation everything else builds on.

---

## Answers to Open Questions (Resolved Before Build)

| Question | Answer |
|---|---|
| Float status strings in DB? | `Shared`, `Under Review`, `Shortlisted`, `Interviewing`, `Rejected`, `Hired` |
| Which consultant receives nudge? | Look up `platformUsers.name = floats.consultant`; fallback to broadcast to all consultants |
| Structured feedback input format? | Form with labelled textareas (Positives / Areas to Improve / Next Steps) — guided format for consultants |
| Dream company suggestion engine? | Phase 3 scope |
| Communities launch timing? | Phase 6 scope |
| Assessment eligibility gate? | Score tier (A/B/C) assigned by consultant/admin — Phase 4 scope |

---

## DB Schema Changes (Migration)

### Modified tables — `src/db/schema.ts`

**`floats` table — new columns:**
```typescript
feedbackPositives: text('feedback_positives'),
feedbackImprovements: text('feedback_improvements'),
feedbackNextSteps: text('feedback_next_steps'),
interviewDate: varchar('interview_date', { length: 20 }),
nudgeSentAt: datetime('nudge_sent_at'),
```

**`platformUsers` table — new columns:**
```typescript
bio: text('bio'),
vertical: varchar('vertical', { length: 100 }),
expertiseTags: json('expertise_tags').$type<string[]>().default([]),
linkedinUrl: varchar('linkedin_url', { length: 500 }),
consultantProfilePic: text('consultant_profile_pic'),
```

**New table — `candidate_notifications`:**
```typescript
export const candidateNotifications = pgTable('candidate_notifications', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  type: varchar('type', { length: 50 }),
  // status_update | feedback_received | nudge_ack | assessment_ready
  message: text('message').notNull(),
  link: varchar('link', { length: 255 }),
  isRead: boolean('is_read').default(false),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('cn2_cand_id_idx').on(table.candId),
}));
```

### Migration file — `src/db/migrations/0026_candidate_portal_phase1.sql`
```sql
ALTER TABLE floats ADD COLUMN IF NOT EXISTS feedback_positives TEXT;
ALTER TABLE floats ADD COLUMN IF NOT EXISTS feedback_improvements TEXT;
ALTER TABLE floats ADD COLUMN IF NOT EXISTS feedback_next_steps TEXT;
ALTER TABLE floats ADD COLUMN IF NOT EXISTS interview_date VARCHAR(20);
ALTER TABLE floats ADD COLUMN IF NOT EXISTS nudge_sent_at TIMESTAMP;

ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS vertical VARCHAR(100);
ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS expertise_tags JSON DEFAULT '[]';
ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS consultant_profile_pic TEXT;

CREATE TABLE IF NOT EXISTS candidate_notifications (
  id SERIAL PRIMARY KEY,
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id),
  type VARCHAR(50),
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cn2_cand_id_idx ON candidate_notifications(cand_id);
```

---

## Feature 1.1 — Candidate Portal Navigation

### [MODIFY] `src/components/shared/Sidebar.tsx`

When `userRole === "candidate"`, render this nav:

| Icon | Label | Route | Status |
|---|---|---|---|
| 🏠 | Home | `/candidate` | Active |
| 📋 | My Applications | `/candidate/applications` | Active |
| 👤 | My Profile | `/candidate/profile` | Active |
| 🤝 | My Consultants | `/candidate/consultants` | Active |
| 🛡️ | Verification | `/candidate/verification` | Skeleton |
| 💼 | Jobs | `/candidate/jobs` | Coming Soon |
| ⭐ | Dream Companies | `/candidate/dream-companies` | Coming Soon |

"Coming Soon" items: render as dimmed nav links with a small badge. They lead to a placeholder page — not a 404.

---

## Feature 1.2 — Candidate Home Dashboard

### [NEW] `src/app/candidate/page.tsx`
Replaces the current `redirect('/candidate/profile')` with a real page component.

### [NEW] `src/features/candidate-portal/components/CandidateHome.tsx`

**Server data fetch (in `page.tsx`):**
```typescript
const myFloats = await db.select().from(floats)
  .where(and(eq(floats.candId, linkedCandidateId), eq(floats.isDeleted, false)))
  .orderBy(desc(floats.createdAt)).limit(20);

const candidate = await getCandidateById(linkedCandidateId);

const unreadCount = await db.select({ count: sql<number>`count(*)` })
  .from(candidateNotifications)
  .where(and(
    eq(candidateNotifications.candId, linkedCandidateId),
    eq(candidateNotifications.isRead, false)
  ));
```

**UI Structure:**

**A — Welcome Header:** Photo/initials avatar, candidate name, role + company, verification badge placeholder.

**B — Stats Row (4 cards):**

| Card Label | Source |
|---|---|
| Profiles Shared | Count of all floats |
| Awaiting Response | floats where status = `Shared` or `Under Review` |
| Interviews Scheduled | floats where status = `Interviewing` |
| Feedback Available | floats where any feedback field is non-null |

**C — Recent Activity Feed:** Last 5 floats by `createdAt` desc.  
Each row: `[Company] — [Role] — [Status Badge] — [Date]`  
Click → routes to `/candidate/applications?highlight=[floatId]`

---

## Feature 1.3 — My Applications (Interview Feedback Loop)

> **Highest-priority feature in the entire BRD. (Req #1, #2)**

### [NEW] `src/app/candidate/applications/page.tsx`
### [NEW] `src/features/candidate-portal/components/ApplicationsClient.tsx`

**Server data fetch:**
```typescript
const myFloats = await db.select().from(floats)
  .where(and(eq(floats.candId, linkedCandidateId), eq(floats.isDeleted, false)))
  .orderBy(desc(floats.createdAt));
```

---

### Status → Timeline Mapping (Confirmed DB values)

| DB Value | Candidate Label | Step |
|---|---|---|
| `Shared` | Profile Shared | 1 |
| `Under Review` | Under Review by Client | 2 |
| `Shortlisted` | Shortlisted for Interview | 3 |
| `Interviewing` | Interview in Progress | 4 |
| `Rejected` | Not Moving Forward | Terminal |
| `Hired` | Offer Accepted 🎉 | Terminal (positive) |

---

### Application Card Spec

```
┌───────────────────────────────────────────────────────────────────┐
│  [Avatar]  Hindustan Unilever Limited                  ● Active   │
│            CFO – Mumbai                                           │
│            Shared on 15 Jul 2025 · Via: Email                     │
│                                                                   │
│  ●──────────────●──────────────●──────────────○────────○         │
│  Profile        Under          Shortlisted    Interview  Decision │
│  Shared ✓       Review ✓       ✓              Pending    –        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  📋  Interview Feedback                                     │ │
│  │  ✅  Positives: Strong strategic track record...            │ │
│  │  🔁  Areas to Improve: Board-level communication...         │ │
│  │  📌  Next Steps: Second round with MD scheduled for...      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [🔔 Nudge Consultant — Request an Update]                        │
└───────────────────────────────────────────────────────────────────┘
```

**Feedback card display rules:**
- Show if ANY of `feedbackPositives`, `feedbackImprovements`, `feedbackNextSteps` is non-null.
- If none: show "Feedback will appear here once received from the client."

**Nudge button display rules:**
- Hidden for `Rejected` and `Hired` floats
- Hidden if `nudgeSentAt` is within the last 48 hours (show "Request sent — we're on it!" instead)
- Visible after 7+ days with no status update on all other floats

**Nudge button action — `src/actions/candidate-portal.ts`:**
```typescript
export async function nudgeConsultantAction(floatId: string) {
  // 1. Get the float record
  const [float] = await db.select().from(floats).where(eq(floats.id, floatId));
  
  // 2. Stamp nudgeSentAt
  await db.update(floats)
    .set({ nudgeSentAt: new Date() })
    .where(eq(floats.id, floatId));
  
  // 3. Route to specific consultant if found, else broadcast
  const [consultantUser] = await db.select({ id: platformUsers.id })
    .from(platformUsers)
    .where(eq(platformUsers.name, float.consultant ?? ''))
    .limit(1);
  
  await db.insert(consultantNotifications).values({
    userId: consultantUser?.id ?? null,
    targetRole: consultantUser ? null : 'consultant',
    message: `Candidate is requesting a status update on their application to ${float.client} – ${float.role}. Please follow up.`,
    link: `/dashboard/float-list/${float.candId}`,
    isRead: false,
  });
}
```

**Client-side nudge state:**
- Store `nudge_${floatId}` timestamp in `localStorage` after nudge
- Use this to show disabled state without extra DB round-trip on next render

---

### Consultant Structured Feedback (MK OS Side)

### [MODIFY] `src/features/float-list/components/SubmissionsClient.tsx`

In the submission edit modal, add a collapsible "Candidate Feedback" section:

```
┌──────────────────────────────────────────────────┐
│  📋  Candidate-Facing Feedback                   │
├──────────────────────────────────────────────────┤
│  ✅  Positives                                   │
│  [textarea — What went well? Strengths noted...]  │
│                                                  │
│  🔁  Areas to Improve                            │
│  [textarea — What could be stronger?...]          │
│                                                  │
│  📌  Next Steps                                  │
│  [textarea — What happens next? Timeline?...]     │
│                                                  │
│  📅  Interview Date (if applicable)              │
│  [date input]                                    │
│                                                  │
│  [Save Feedback]                                 │
└──────────────────────────────────────────────────┘
```

**On save → new action: `saveFloatFeedbackAction(floatId, feedback)`**
- Updates `floats` feedback columns
- Creates `candidateNotifications` record: "Interview feedback is now available for your application to [Company]."

---

### Candidate Notification on Status Change

### [MODIFY] `src/actions/index.ts`

Wherever `floats.status` is updated, insert into `candidateNotifications`:

```typescript
const FLOAT_STATUS_LABELS: Record<string, string> = {
  'Shared': 'Profile Shared',
  'Under Review': 'Under Review by Client',
  'Shortlisted': 'Shortlisted for Interview',
  'Interviewing': 'Interview Scheduled',
  'Rejected': 'Application Closed',
  'Hired': 'Offer Accepted — Congratulations!',
};
await db.insert(candidateNotifications).values({
  candId: float.candId,
  type: 'status_update',
  message: `Your application to ${float.client} – ${float.role} has been updated: ${FLOAT_STATUS_LABELS[newStatus]}.`,
  link: '/candidate/applications',
  isRead: false,
});
```

---

### Notification Bell

### [MODIFY] `src/components/shared/Topbar.tsx`
### [NEW] `src/features/candidate-portal/components/CandidateNotificationBell.tsx`
### [NEW] `src/app/api/candidate-notifications/route.ts`

When `userRole === "candidate"`:
- Bell icon in topbar with red unread count badge
- Click → dropdown of last 10 notifications
- "Mark all read" button

---

## Feature 1.4 — Know Your MK Partner (Consultant Directory)

### [NEW] `src/app/candidate/consultants/page.tsx`
### [NEW] `src/features/candidate-portal/components/ConsultantDirectoryClient.tsx`

**Server data fetch:**
```typescript
const consultants = await db.select({
  id: platformUsers.id,
  name: platformUsers.name,
  email: platformUsers.email,
  bio: platformUsers.bio,
  vertical: platformUsers.vertical,
  expertiseTags: platformUsers.expertiseTags,
  linkedinUrl: platformUsers.linkedinUrl,
  profilePic: platformUsers.consultantProfilePic,
}).from(platformUsers)
.where(and(
  inArray(platformUsers.role, ['consultant', 'admin']),
  eq(platformUsers.isDeleted, false),
  eq(platformUsers.status, 'Active')
));
```

**Card layout:**
- Avatar / photo
- Name + Vertical (e.g., "Finance Vertical Lead")
- Bio excerpt (truncated to 2 lines)
- Expertise tag chips
- LinkedIn icon link + Email link
- Filter bar: by vertical, by sector tag

### [MODIFY] `src/app/dashboard/admin/users/` — user detail/edit view
Add editable fields: Bio, Vertical, Expertise Tags (multi-select), LinkedIn URL, Profile Photo upload.

---

## Feature 1.5 — Candidate Profile View (Redesigned)

### [MODIFY] `src/app/candidate/profile/page.tsx`
Replace `FlCandidateClient` with `<CandidateProfileView candidate={candidate} />`.

### [NEW] `src/features/candidate-portal/components/CandidateProfileView.tsx`

| Section | Fields |
|---|---|
| Header | Photo, Name, Designation, Company, Location |
| Current Role | Company, Designation, Start Date |
| Compensation | Current CTC, Expected CTC, Notice Period |
| Education | `candidates.qual` |
| Tags | `candidates.expTags` |
| Past Companies | `candidates.pastCompanies` |
| LinkedIn | Link |
| CV Download | If `hasCv = true` |

**Never shown:** `score`, internal notes, pipeline stage, `metadata`, audit logs.

---

## Feature 1.6 — Verification Skeleton

### [NEW] `src/app/candidate/verification/page.tsx`

Simple status shell:
- Reference Check: Not Started (reads from `floatReferences` count)
- Assessment: Not Started
- Verification Badge: Not Yet Earned
- Informational copy explaining the process

Phase 2 will replace this with the full reference check detail view.

---

## Feature 1.7 — SLA Auto-Reminder (Inngest)

### [MODIFY] `src/lib/inngest/functions.ts`

New scheduled function: `candidate-feedback-sla-check`
- Cron: `0 9 * * *` (daily at 9AM UTC)
- Finds floats where: not terminal status + created 7+ days ago + nudge not sent in 48hrs
- For each: finds specific consultant user (`platformUsers.name = floats.consultant`); falls back to broadcast
- Creates `consultantNotifications` record with SLA alert message

---

## File Manifest

### New Files
| Path | Type |
|---|---|
| `src/db/migrations/0026_candidate_portal_phase1.sql` | SQL Migration |
| `src/app/candidate/page.tsx` | Page (replaces redirect) |
| `src/app/candidate/applications/page.tsx` | Page |
| `src/app/candidate/consultants/page.tsx` | Page |
| `src/app/candidate/verification/page.tsx` | Page |
| `src/app/api/candidate-notifications/route.ts` | API Route |
| `src/features/candidate-portal/components/CandidateHome.tsx` | Component |
| `src/features/candidate-portal/components/ApplicationsClient.tsx` | Component |
| `src/features/candidate-portal/components/ConsultantDirectoryClient.tsx` | Component |
| `src/features/candidate-portal/components/CandidateProfileView.tsx` | Component |
| `src/features/candidate-portal/components/VerificationStatusClient.tsx` | Component |
| `src/features/candidate-portal/components/CandidateNotificationBell.tsx` | Component |
| `src/actions/candidate-portal.ts` | Server Actions |

### Modified Files
| Path | Change |
|---|---|
| `src/db/schema.ts` | New columns on `floats` + `platformUsers`; new `candidateNotifications` table |
| `src/components/shared/Sidebar.tsx` | Candidate nav items |
| `src/components/shared/Topbar.tsx` | Notification bell for candidates |
| `src/features/float-list/components/SubmissionsClient.tsx` | Structured feedback section |
| `src/actions/index.ts` | Candidate notification trigger on float status change |
| `src/lib/inngest/functions.ts` | SLA cron function |
| `src/app/dashboard/admin/users/` | Consultant bio/vertical/tags/pic fields |

---

## Recommended Build Order

1. DB migration → update schema.ts
2. `src/actions/candidate-portal.ts` (nudge, feedback save, mark-read)
3. Sidebar nav (enables visual testing immediately)
4. `CandidateProfileView` (simplest warm-up component)
5. `ApplicationsClient` (core feature — most complex)
6. Structured feedback in `SubmissionsClient`
7. Status change → `candidateNotifications` in `src/actions/index.ts`
8. `ConsultantDirectoryClient`
9. `CandidateNotificationBell` + API route
10. `CandidateHome` (aggregates everything above)
11. Verification skeleton
12. Inngest SLA job

---

## Testing Checklist

- [ ] Candidate login → sees candidate-only nav, not consultant nav
- [ ] Home stats accurate (floats count, awaiting, etc.)
- [ ] Each float renders with correct stage highlighted in timeline
- [ ] Feedback card hidden when no feedback entered by consultant
- [ ] Nudge button hidden for Rejected/Hired floats
- [ ] Nudge button hidden within 48hrs of last nudge
- [ ] Nudge click creates `consultantNotifications` + stamps `nudgeSentAt`
- [ ] Consultant feedback save creates `candidateNotifications` record
- [ ] Float status change auto-creates candidate notification
- [ ] Notification bell shows correct unread count
- [ ] Mark all read works
- [ ] Consultant directory shows only active consultant/admin users
- [ ] Admin can edit bio/vertical/expertise for consultants
- [ ] Profile view shows NO internal fields (score, notes, pipeline stage)
- [ ] Verification page shows correct placeholder
- [ ] SLA Inngest job creates notifications for overdue floats
