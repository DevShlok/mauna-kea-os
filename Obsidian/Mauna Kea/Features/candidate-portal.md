# Candidate Portal

**Route prefix:** `/[candidateSlug]/*` (slug routing) and `/candidate/*` (redirect shims)  
**Access:** `requireRole(['candidate'])`  
**Layout:** `src/app/[clientSlug]/layout.tsx` — shared sidebar (CandidateSidebar) and topbar

## Routing Model
The candidate portal uses slug-based routing — the same dynamic segment `[clientSlug]` handles both client and candidate portals. The page router differentiates by looking up the slug in `candidates` first, then `clients`.

`/candidate/*` routes are redirect shims: they resolve the candidate's slug from `platformUsers.linkedCandidateId` and redirect to `/${slug}/*`.

## Page Map

| Route | What it shows |
|---|---|
| `/${slug}/` | Home (stats) OR Onboarding Shell (if `profileCompletedAt` null) |
| `/${slug}/profile` | Full profile view (CandidateProfileView) |
| `/${slug}/applications` | Unified applications tracker (ApplicationsClient) |
| `/${slug}/verification` | Verification status + badges + tier (VerificationStatusClient) |
| `/${slug}/jobs` | Curated jobs board (JobsClient) |
| `/${slug}/dream-companies` | Dream 10 company tracking (DreamCompaniesClient) |
| `/${slug}/consultants` | Know Your MK Partner directory (ConsultantDirectoryClient) |
| `/${slug}/guidance` | Consultant-curated guidance notes — Phase 3 |

## Recent Enhancements (2026-08-10)

### 1. Profile Edit Protection & Approval Workflow
- Candidates editing sensitive fields (Compensation, Notice Period, Current Role, Overall Experience, Past Employers, Education) generate a `[[Database/candidate_profile_change_requests|candidate_profile_change_requests]]` entry.
- Non-sensitive fields (hometown, relocation, dream roles, photo) update immediately.
- Pending review banner is displayed on the candidate profile.
- Consultants review and approve/reject changes side-by-side in `FlCandidateClient.tsx`.

### 2. Conversational Profile Onboarding
- `Step3_Conversational.tsx` features 10 guided questions with quick option selection pills and progress bar animations.

### 3. My Consultants Directory
- Displays active consultants and admins with real bio, practice vertical, expertise tags, picture, and email links.

### 4. Verification Milestone Badges
- Replaced legacy step cards with milestone achievement badges (`Profile Verified`, `Assessment Completed`, `Reference Check Completed`, `AI Interview Completed`).

### 5. Unified Applications Tracker
- Unified direct candidate job applications and consultant float submissions with standard BRD recruitment workflow stages (`Profile Submitted` → `Profile Shortlisted` → `Interview Scheduled` → `Interview Completed` → `Offer Released / Rejected` → `Offer Accepted` → `Joined`).

## Related Notes
- [[Features/candidate-onboarding]]
- [[Database/candidate_profile_change_requests]]
- [[Features/verification]]
- [[Features/internal-os]]
