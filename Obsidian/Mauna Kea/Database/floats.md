# floats (Submissions)

**Table:** `floats` | **PK:** `id varchar(50)` (format: `SUB-<uuid>`)

## Purpose
A "float" is a formal submission — the act of presenting a candidate to a client for a specific mandate. The Float List (`/dashboard/float-list`) is the internal CRM view of all active submissions.

## Why "Float"?
Domain terminology at Mauna Kea. When a consultant submits a candidate profile to a client, they are "floating" the candidate. See [[Decisions/floats-vs-candidates]].

## Notable Columns
- `candId` → [[candidates]]
- `clientId` → [[clients]]
- `mandateId` → [[mandates]] (optional — a float can exist without a mandate)
- `status` — submission pipeline stage (mirrors mandate pipeline: universe → offered)
- `dateShared` — when the profile was sent to the client (varchar date, not timestamp)
- `via` (JSON string[]) — communication channels used: `['Email', 'WhatsApp', 'LinkedIn']`
- `feedbackPositives` / `feedbackImprovements` / `feedbackNextSteps` — Phase 1 structured client feedback, shown in candidate portal
- `nudgeSentAt` — timestamp of last nudge email, enforces 7-day cooldown
- `isDeleted` — soft delete

## Relationships
- → [[candidates]] (one)
- → [[clients]] (one)
- → [[mandates]] (one, nullable)
- → [[float_followups]] (many)
- → [[float_activities]] (many)

## Key Indexes
`candId`, `clientId`, `mandateId`, `status`, `isDeleted`

## Related Feature
[[Features/float-list]]
