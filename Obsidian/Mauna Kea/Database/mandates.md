# mandates

**Table:** `mandates` | **PK:** `id serial`

## Purpose
Represents an active or historical executive search mandate — a client's request to find a candidate for a specific role. The mandate is the primary unit of work in the internal consultant OS.

## Notable Columns
- `status` — pipeline stage: `universe | longlisted | shortlisted | submitted | interviewing | offered | closed`
- `internalStatus` — internal workflow state: `contractsent | engaged | paused | ...`
- `sectors` (JSON string[]) — industry sectors for the role
- `frameworkId` → [[frameworks]] — scoring framework applied to this search
- `clientId` → [[clients]]
- `targetCompanies` (JSON) — companies being targeted for sourcing
- `jdText` / `interviewNotesText` / `additionalDocsText` — full-text content of attached documents
- `auditLog` (JSON) — field-level audit log (same pattern as [[candidates]])
- `isDeleted` — soft delete

## Relationships
- → [[clients]] (one) via `clientId`
- → [[frameworks]] (one) via `frameworkId`
- → [[mandate_candidates]] (many)
- → [[floats]] (many)
- → [[client_notifications]] (many)
- → [[client_remarks]] (many)

## Key Indexes
`company`, `role`, `status`, `clientId`, `isDeleted`
