# BRD Phase 0 — Finish What's Already Built
> **Timeline:** 1–2 weeks · **Depends on:** Nothing (all infrastructure exists)  
> **Goal:** Close every partial implementation so Phase 1+ builds on solid ground, with zero regressions.

---

## Existing Codebase Context

The project is a **Next.js 15 App Router** application (`src/app/`) using **Drizzle ORM** on **PostgreSQL**, with server actions in `src/actions/`. The candidate portal lives at `src/app/[clientSlug]/page.tsx` (dynamic slug routing handles clients, candidates, and will extend to consultants). The admin/consultant dashboard is at `src/app/dashboard/`.

### What already works (do not break)
- `ApplicationsClient.tsx` — interview feedback pipeline (5 stages, nudge button, structured feedback panel)
- `CandidateHome.tsx` — returning-user dashboard with 4 stat cards + recent activity + notifications
- `[clientSlug]/page.tsx` — routes to `OnboardingShell` when `candidate.profileCompletedAt` is null, otherwise shows `CandidateHome`. **This gating is already live.**
- `OnboardingShell.tsx` + `Step1_UploadCV.tsx`, `Step2_LinkedInUpload.tsx`, `Step3_Conversational.tsx`, `Step4_ReviewProfile.tsx` — 4-step onboarding flow already built
- `ConsultantDirectoryClient.tsx` — renders consultant cards from `platformUsers` (bio, vertical, expertiseTags, linkedinUrl, consultantProfilePic)
- `VerificationStatusClient.tsx` — candidate verification status page
- `referenceChecks` table + `reference-checks.ts` actions (create, update, delete, markVerified, toggleClientShare)
- `candidateNotifications` + `consultantNotifications` tables — both working
- `nudgeConsultantAction` — fully wired with 7-day and 2-day cooldown logic

---

## Task 1: Consultant Profile Editor (Admin)

### What's Missing
`platformUsers` has the columns `bio`, `vertical`, `expertiseTags`, `linkedinUrl`, `consultantProfilePic` — but the admin Users page (`UsersClient.tsx`) has no form to fill these fields. The Know Your MK Partner directory shows empty cards as a result.

### Implementation

**File: `src/features/admin/components/UsersClient.tsx`**
- Add an "Edit Profile" drawer/modal that opens when clicking on a consultant row.
- Fields to expose: `bio` (textarea), `vertical` (text), `expertiseTags` (comma-separated input → JSON array), `linkedinUrl` (text), `consultantProfilePic` (URL input or base64 upload matching the pattern in `updateProfilePhotoAction`).
- Only show these fields when the user's `role === 'consultant'`.

**File: `src/actions/index.ts` (or a new `src/actions/users.ts`)**
Add server action:
```ts
export async function updateConsultantProfileAction(userId: string, data: {
  bio?: string;
  vertical?: string;
  expertiseTags?: string[];
  linkedinUrl?: string;
  consultantProfilePic?: string;
}) {
  await requireRole(['admin']);
  await db.update(platformUsers).set(data).where(eq(platformUsers.id, userId));
  revalidatePath('/dashboard/admin/users');
  revalidatePath('/candidate/consultants');
  return { success: true };
}
```

**Revalidate paths:** Both `/dashboard/admin/users` and `/candidate/consultants` so the directory reflects edits immediately.

### Acceptance Criteria
- Admin can open a drawer, fill `bio` / `vertical` / `expertiseTags` for any consultant.
- After saving, `ConsultantDirectoryClient.tsx` shows the updated values without a manual cache bust.

---

## Task 2: Reference Check Fill-Out UI (Consultant)

### What's Missing
The `reference-checks.ts` actions (`createReferenceCheckAction`, `updateReferenceCheckAction`, `markCandidateVerifiedAction`) exist, but there is no consultant-facing UI form to use them. They were callable from code but have no attached view.

### Where to Add It
**File: `src/app/dashboard/candidates/[id]/page.tsx` or the candidate detail panel**
- Add a "Reference Checks" tab/section to the candidate detail view.
- Form fields: Referee Name, Relationship, Company, Summary (Positives / Improvements / Neutral), Status dropdown (`In Progress | Completed`).
- Button: "Mark as Verified" — calls `markCandidateVerifiedAction`, which upserts `candidateVerifications` and sends candidate notification.
- Button: "Share with Client" toggle — calls `toggleClientShareAction`.

**Component to create:** `src/features/candidates/components/ReferenceCheckPanel.tsx`
- List existing reference checks for candidate (queried server-side via `db.select().from(referenceChecks).where(eq(referenceChecks.candId, candId))`).
- Inline edit per check.
- "Add New Reference Check" button opens a form.

### Acceptance Criteria
- Consultant opens a candidate detail page, navigates to Reference Checks tab.
- Can add/edit/delete reference checks.
- Clicking "Mark Verified" creates the `candidateVerifications` row and sends the in-app notification to the candidate.

---

## Task 3: Reference Check Visibility (Candidate Side)

### What's Missing
The `VerificationStatusClient.tsx` exists but only shows verification status / badge. It does not show the actual reference check summaries (`summaryPositives`, `summaryImprovements`, `summaryNeutral`) from `referenceChecks` where `isSharedWithClient = true`.

### Implementation

**File: `src/app/candidate/verification/page.tsx`** (or equivalent slug-based route)
- Server-side: fetch `referenceChecks` where `candId = platformUser.linkedCandidateId AND isSharedWithClient = true`.
- Pass `checks` prop to `VerificationStatusClient`.

**File: `src/features/candidate-portal/components/VerificationStatusClient.tsx`**
- Add a section below the badge banner: "Your Reference Check Summaries".
- Render each check as a card: Referee name & company, then 3 labelled text blocks (Positives, Areas for Growth, Neutral Observations).
- Only render this section if `isVerified && checks.length > 0`.
- If not verified yet: show a placeholder "Your reference check summaries will appear here once verified."

### Acceptance Criteria
- Candidate navigates to `/candidate/verification` (or `/{slug}/verification`).
- If `isSharedWithClient = true` checks exist, summaries are visible.
- If not verified, placeholder is shown.

---

## Task 4: Auto-Reminder Cron Job (7-Day Nudge to Consultants)

### What's Missing
The `nudgeConsultantAction` works manually (candidate clicks "Nudge"). However, there is no automated background process to auto-send reminders to consultants when a float has had no status change for 7 days.

### Implementation

**File: `src/app/api/cron/nudge-floats/route.ts`** (new)
```ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { floats, consultantNotifications, platformUsers } from '@/db/schema';
import { and, isNull, lte, eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Verify cron secret so only Vercel/authorized caller can trigger
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find floats: not terminal, not deleted, updatedAt older than 7 days, no nudge in last 7 days
  const stalledFloats = await db
    .select()
    .from(floats)
    .where(
      and(
        eq(floats.isDeleted, false),
        lte(floats.updatedAt, sevenDaysAgo),
        // Status is still active (not Hired/Rejected)
        or(
          isNull(floats.status),
          // Exclude terminal states
        )
      )
    );

  for (const float of stalledFloats) {
    const [consultant] = await db
      .select({ id: platformUsers.id })
      .from(platformUsers)
      .where(eq(platformUsers.name, float.consultant ?? ''))
      .limit(1);

    await db.insert(consultantNotifications).values({
      userId: consultant?.id ?? null,
      targetRole: consultant ? null : 'consultant',
      message: `Reminder: No update has been recorded for ${float.client || 'a client'} – ${float.role || 'role'} in 7+ days. Please check in with the client.`,
      link: `/dashboard/float-list/${float.candId}`,
      isRead: false,
    });

    // Stamp nudgeSentAt so we don't double-notify
    await db.update(floats).set({ nudgeSentAt: new Date() }).where(eq(floats.id, float.id));
  }

  return NextResponse.json({ notified: stalledFloats.length });
}
```

**File: `vercel.json`** (add cron config)
```json
{
  "crons": [
    {
      "path": "/api/cron/nudge-floats",
      "schedule": "0 9 * * *"
    }
  ]
}
```
Set `CRON_SECRET` in Vercel environment variables.

### Key invariant
- Do not notify if `nudgeSentAt` is within the last 2 days (mirrors the manual nudge cooldown in `canNudge()`).
- Do not notify for terminal statuses: `Hired`, `Rejected`.

### Acceptance Criteria
- Cron fires daily at 9 AM.
- Consultant receives an in-app notification for each float stalled > 7 days.
- Float's `nudgeSentAt` is stamped after notification to prevent duplicate sends.

---

## DB Changes Required

None — all columns referenced above already exist in the current schema:
- `platformUsers.bio`, `vertical`, `expertiseTags`, `linkedinUrl`, `consultantProfilePic` ✅
- `referenceChecks.summaryPositives`, `summaryImprovements`, `summaryNeutral`, `isSharedWithClient` ✅
- `floats.nudgeSentAt`, `updatedAt` ✅
- `candidateVerifications.status`, `badgeLevel` ✅

---

## Testing Checklist
- [ ] Admin edits consultant profile → directory shows updated data
- [ ] Consultant adds reference check → shows in candidate detail
- [ ] Consultant clicks "Mark Verified" → candidate sees badge + notification
- [ ] Candidate navigates to `/verification` → sees summaries (if shared)
- [ ] Cron route returns `{ notified: N }` when called with correct `CRON_SECRET`
- [ ] `npx tsc --noEmit` passes with 0 errors after all changes
