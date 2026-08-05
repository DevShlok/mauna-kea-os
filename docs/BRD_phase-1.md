# BRD Phase 1 — Candidate-Facing UX Gaps
> **Timeline:** 1 sprint (~1 week) · **Depends on:** Phase 0 complete  
> **Goal:** Give first-time candidates a guided onboarding experience instead of dropping them on a dashboard, and wire the self-apply flow end-to-end.

---

## Existing Codebase Context

### Onboarding flow (already built, do not re-build)
The 4-step onboarding shell exists and is already conditionally routed in `[clientSlug]/page.tsx`:
```ts
const isOnboarded = !!candidate.profileCompletedAt;
if (!isOnboarded) {
  return <OnboardingShell candId={candId} candidate={candData} />;
}
```

The 4 steps live in `src/features/candidate-portal/onboarding/`:
- `Step1_UploadCV.tsx` — CV upload
- `Step2_LinkedInUpload.tsx` — LinkedIn profile URL
- `Step3_Conversational.tsx` — conversational data fill
- `Step4_ReviewProfile.tsx` — review and confirm

**`profileCompletedAt`** is stamped on `candidates` when onboarding completes (`src/actions/candidate-onboarding.ts`).

### Self-apply schema (already built)
```
candidateApplications: id, candId→candidates.id, source, jobId→candidateJobs.id, mandateId→mandates.id, status, appliedAt, updatedAt
candidateJobInterests: id, jobId→candidateJobs.id, candId→candidates.id, status, createdAt
```
`markJobInterestAction` in `candidate-portal.ts` already upserts `candidateJobInterests` and fires a consultant notification.

---

## Task 1: Verify & Harden the Onboarding Flow

### Audit Points
The routing already works. This task ensures the steps don't break in production edge cases.

**File: `src/features/candidate-portal/onboarding/OnboardingShell.tsx`**
- Confirm that completing Step 4 stamps `profileCompletedAt` via `candidate-onboarding.ts` action.
- Confirm that if a candidate refreshes mid-onboarding, they resume at the correct step (not step 1).
- Add a step state to localStorage keyed by `candId` so refresh-resilience works: `mk_onboarding_step_{candId}`.
- After `profileCompletedAt` is stamped, call `router.refresh()` so the server re-fetches and routes to `CandidateHome` — this avoids the stale cached page showing onboarding again.

**File: `src/actions/candidate-onboarding.ts`**
- Verify `completeOnboardingAction` (or equivalent) stamps `profileCompletedAt: new Date()`.
- Also create the `candidateBadges` row for `'profile_complete'` badge on completion:
```ts
await db.insert(candidateBadges).values({
  candId,
  badgeType: 'profile_complete',
  earnedAt: new Date(),
}).onConflictDoNothing();
```

### Acceptance Criteria
- New candidate → redirected to onboarding shell (Step 1)
- Refresh mid-flow → stays on same step
- Complete Step 4 → `profileCompletedAt` set, badge created, redirect to home dashboard
- Returning candidate → goes directly to `CandidateHome`

---

## Task 2: Self-Apply Flow Completion

### What's Missing
`candidateApplications` table exists, `markJobInterestAction` fires interest signals, but there is no end-to-end "Apply" UX where:
1. Candidate clicks "Apply" on a job card in `/candidate/jobs`
2. A `candidateApplications` row is created with `status = 'Profile Submitted'`
3. A consultant notification fires
4. The candidate sees a confirmation state on the job card

### Implementation

**File: `src/actions/candidate-portal.ts`** — add action:
```ts
export async function selfApplyAction(jobId: number) {
  const { platformUser } = await requireRole(['candidate']);
  const candId = platformUser!.linkedCandidateId!;

  // Idempotent: don't create duplicate application
  const existing = await db.select()
    .from(candidateApplications)
    .where(and(eq(candidateApplications.candId, candId), eq(candidateApplications.jobId, jobId)))
    .limit(1);

  if (existing.length > 0) return { success: true, alreadyApplied: true };

  await db.insert(candidateApplications).values({
    candId,
    jobId,
    source: 'direct',
    status: 'Profile Submitted',
  });

  // Notify consultants
  const [cand] = await db.select().from(candidates).where(eq(candidates.id, candId)).limit(1);
  const [job] = await db.select().from(candidateJobs).where(eq(candidateJobs.id, jobId)).limit(1);
  await db.insert(consultantNotifications).values({
    userId: null,
    targetRole: 'consultant',
    message: `${cand?.name || 'A candidate'} has self-applied for: ${job?.title || '#' + jobId}`,
    link: `/dashboard/candidate-jobs`,
  });

  revalidatePath('/candidate/jobs');
  return { success: true };
}
```

**File: `src/features/candidate-portal/components/JobsClient.tsx`**
- Replace the current "Interested" interest-signal button with a dual-action:
  - "Express Interest" → calls `markJobInterestAction` (existing, soft signal)
  - "Apply" → calls `selfApplyAction` (creates `candidateApplications` row)
- Show applied state: if `applications.some(a => a.jobId === job.id)`, show "Applied ✓" badge on card.
- Pass `applications: CandidateApplication[]` as a prop (fetched server-side from `candidateApplications`).

**File: `src/app/candidate/jobs/page.tsx`** (or the slug-based equivalent)
- Server-side: also query `candidateApplications` for the current candidate and pass to `JobsClient`.

### Consultant Dashboard View

**File: `src/app/dashboard/candidate-jobs/page.tsx`**
- Add a "Self-Applied Candidates" section listing `candidateApplications` joined with `candidates` + `candidateJobs`.
- Show: Candidate name, job title, status, date applied.
- Status update dropdown for consultant: `Profile Submitted → Under Review → Shortlisted → Closed`.

**File: `src/actions/candidate-portal.ts`** — add:
```ts
export async function updateApplicationStatusAction(applicationId: number, status: string) {
  await requireRole(['admin', 'consultant']);
  await db.update(candidateApplications).set({ status, updatedAt: new Date() }).where(eq(candidateApplications.id, applicationId));
  // notify candidate
  const [app] = await db.select().from(candidateApplications).where(eq(candidateApplications.id, applicationId)).limit(1);
  if (app) {
    await db.insert(candidateNotifications).values({
      candId: app.candId,
      type: 'status_update',
      message: `Your self-application status has been updated to: ${status}`,
      link: '/candidate/jobs',
    });
  }
  revalidatePath('/dashboard/candidate-jobs');
  return { success: true };
}
```

---

## DB Changes Required

None — schema is complete:
- `candidateApplications` table exists with all needed columns ✅
- `candidateBadges` table exists for `profile_complete` badge ✅

---

## Route Map After Phase 1

| Route | Who Sees It | Status |
|---|---|---|
| `/{slug}` or `/candidate` | Candidate (new) | → OnboardingShell |
| `/{slug}` or `/candidate` | Candidate (returning) | → CandidateHome |
| `/candidate/jobs` | Candidate | Jobs board + Apply button |
| `/candidate/applications` | Candidate | Float pipeline tracker |
| `/dashboard/candidate-jobs` | Consultant | Curated jobs + self-apply inbox |

---

## Testing Checklist
- [ ] New candidate: onboarding shell shown, profile_complete badge created after Step 4
- [ ] Returning candidate: dashboard shown, not onboarding
- [ ] Candidate clicks Apply → `candidateApplications` row created, consultant notified
- [ ] Clicking Apply again → idempotent, no duplicate row
- [ ] Job card shows "Applied ✓" after apply
- [ ] Consultant can update application status → candidate receives notification
- [ ] `npx tsc --noEmit` passes with 0 errors
