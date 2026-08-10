# Internal OS — Dashboard Structure

**Route:** `/dashboard/*`
**Access:** `requireRole(['admin', 'consultant'])`

## Layout
`src/app/dashboard/layout.tsx` — shared sidebar + topbar for all consultant/admin pages.

## Route Map

| Route | Feature | Component |
|---|---|---|
| `/dashboard` | Overview / home | `src/app/dashboard/page.tsx` |
| `/dashboard/candidates` | Master candidate list | `CandidatesClient.tsx` |
| `/dashboard/candidates/[id]` | Candidate detail view | `FlCandidateClient.tsx` |
| `/dashboard/candidates/[id]/assessment` | Rubric assessment | `AssessmentRubricPanel.tsx` |
| `/dashboard/mandates` | Mandate list | `MandatesClient.tsx` |
| `/dashboard/float-list` | Float (submission) CRM | `FlCandidateClient.tsx` |
| `/dashboard/clients` | Client list | `ClientsClient.tsx` |
| `/dashboard/frameworks` | AI framework management | `FrameworksClient.tsx` |
| `/dashboard/workbench` | AI report workbench | `WorkbenchClient.tsx` |
| `/dashboard/candidate-jobs` | Job posting management | `CandidateJobsClient.tsx` |
| `/dashboard/calls` | Calling list & call plans | `CallsClient.tsx` |
| `/dashboard/analytics` | Analytics dashboard | `AnalyticsClient.tsx` |
| `/dashboard/team` | Team management & HR | `TeamClient.tsx` |
| `/dashboard/admin` | Admin controls (user management, master data) | `UsersClient.tsx` |

## Feature Notes
- [[Features/mandate-pipeline]]
- [[Features/float-list]]
- [[Features/ai-workbench]]
- [[Features/assessment-rubric]]
- [[Features/engagement-tools]]
