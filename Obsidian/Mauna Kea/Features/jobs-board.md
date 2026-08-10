# Jobs Board

**Route:** `/${slug}/jobs`  
**Component:** `src/features/candidate-portal/components/JobsClient.tsx`  
**Helper Library:** `src/lib/job-matching.ts` (`computeJobMatchScore`)  
**Server page:** `src/app/[clientSlug]/jobs/page.tsx`  
**Tables:** [[Database/other-tables#candidate_jobs]], [[Database/other-tables#candidate_job_interests]], [[Database/other-tables#candidate_applications]]

## What It Is
Consultants post curated job openings in the admin (`/dashboard/candidate-jobs`). Candidates see relevant non-confidential jobs with real-time **AI Profile Match % Scores** and 1-click application submission.

## AI Profile Match % Score Engine (#10 & #25)
- Powered by `computeJobMatchScore(candidate, job)` in `src/lib/job-matching.ts`.
- Computes TF-IDF vector overlap between candidate skills/experience tags/designation and job mandate specifications.
- Renders animated **AI Match Badge** (e.g. `92% Profile Match`) on job cards.
- Sorts and pins top match recommendations.

## Interest Signals & Applications
- **Interest Signals**: Candidates mark Interested / Not Interested (`candidate_job_interests`).
- **Direct Applications**: "Apply Now" creates a `candidate_applications` record (`source = 'direct'`).

## Confidential Listings
`candidateJobs.isConfidential = true` → company name hidden as *"Leading Organization"*.

## Related Notes
- [[Features/candidate-portal]]
- [[Database/other-tables#candidate_jobs]]
