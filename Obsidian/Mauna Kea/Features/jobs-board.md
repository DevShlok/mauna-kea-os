# Jobs Board

**Route:** `/${slug}/jobs`
**Component:** `src/features/candidate-portal/components/JobsClient.tsx`
**Server page:** `src/app/[clientSlug]/jobs/page.tsx`
**Tables:** [[Database/other-tables#candidate_jobs]], [[Database/other-tables#candidate_job_interests]], [[Database/other-tables#candidate_applications]]

## What It Is
Consultants post curated job openings in the admin (`/dashboard/candidate-jobs`). Candidates see only the jobs visible to them (public + `targetCandIds` matches).

## Visibility Filter
A job is visible to a candidate if:
- `targetCandIds` is empty/null (public), OR
- `targetCandIds` includes the candidate's `candId`

## Recommendation Engine (Phase 3 — planned)
Tag-based scoring — pure set intersection:
- Candidate tags: `expTags ∪ dreamRoles`
- Job tags: `highlights ∪ sector`
- Overlap count = score
- Jobs with `score > 0` shown in "Recommended for You" (top 3)
- Jobs in `targetCandIds` always pinned to top of recommendations

## Interest Signals
Candidates can mark jobs Interested / Not Interested. Stored in `candidate_job_interests`. Consultants see interest signals in admin.

## Applications
"Apply" button creates a `candidate_applications` row with `source = 'direct'`. Consultants can also create applications on behalf of candidates (`source = 'consultant'`).

## Confidential Listings
`candidateJobs.isConfidential = true` → company name hidden in the UI.
