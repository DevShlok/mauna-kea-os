# Candidate Onboarding

**Route:** `/${slug}/` (renders OnboardingShell when `candidate.profileCompletedAt` is null)
**Component:** `src/features/candidate-portal/components/OnboardingShell.tsx`

## Gate
If `candidates.profileCompletedAt IS NULL`, the candidate home route renders `<OnboardingShell>` instead of `<CandidateHome>`. This gate is checked server-side in `src/app/[clientSlug]/page.tsx`.

## 4 Steps

| Step | Component | What happens |
|---|---|---|
| 1 | `Step1_UploadCV.tsx` | Upload CV (PDF/DOC) → Inngest job processes it → candidate profile pre-filled |
| 2 | `Step2_LinkedInUpload.tsx` | Upload LinkedIn PDF → extracted and merged with CV data |
| 3 | `Step3_Conversational.tsx` | Conversational form to fill remaining gaps |
| 4 | `Step4_ReviewProfile.tsx` | Review all fields → confirm → sets `profileCompletedAt` |

## On Completion
- `candidates.profileCompletedAt` set to `now()`
- `candidateBadges` row inserted with `badgeType = 'profile_complete'`
- Next page load renders `<CandidateHome>` instead of onboarding

## onboardingSource
`candidates.onboardingSource` records which path was used: `'cv' | 'linkedin' | 'manual' | 'conversational'`

## Background CV Processing
Step 1 triggers an Inngest event. The candidate sees a spinner while the background job runs. See [[Architecture/background-jobs]].
