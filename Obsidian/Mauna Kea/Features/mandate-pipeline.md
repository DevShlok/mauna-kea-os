# Mandate Pipeline

**Route:** `/dashboard/mandates`, `/dashboard/candidates/[id]`
**Tables:** [[Database/mandates]], [[Database/mandate_candidates]], [[Database/floats]]

## What It Is
The mandate pipeline is the core workflow of executive search. Each mandate represents a client's open position. Candidates move through stages as the search progresses.

## Mandate Stages (status)
`universe → longlisted → shortlisted → submitted → interviewing → offered → closed`

## Internal Status (internalStatus)
Tracks Mauna Kea's own engagement state with the client: `contractsent → engaged → paused → completed`

## Candidate-in-Mandate Stages (mandate_candidates.stage)
Mirrors mandate status but at the candidate level: allows one candidate to be at different stages across different mandates.

## Key Fields on Mandates
- `frameworkId` — scoring framework for this search (optional)
- `targetCompanies` — companies being actively sourced from
- `searchNotes` — running notes by the consultant
- `jdText` / `interviewNotesText` / `additionalDocsText` — full text content for AI context

## Mandate Candidates
`mandate_candidates` is the junction table. Fields that live here (not on the candidate):
- `stage` — pipeline stage for this candidate in this mandate
- `score` — mandate-specific score (can differ from `candidates.score`)
- `ranking` — manual ranking within the mandate's shortlist
- `competencies` — JSON array of `{ skill, rating }` for structured competency notes
- `isSentToClient` — true when the profile has been shared
- `hasReport` — true when an AI report exists for this pair

## Creating Floats from Mandates
When a consultant submits a candidate to a client, both `mandate_candidates` (for pipeline tracking) and `floats` (for CRM follow-up) records are typically created.
