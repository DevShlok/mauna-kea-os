# Client Portal

**Route:** `/[clientSlug]/` (when slug resolves to a client)
**Access:** `requireRole(['client'])`
**Tables:** [[Database/clients]], [[Database/mandates]], [[Database/floats]], [[Database/other-tables#client_notifications]], [[Database/other-tables#client_remarks]]

## What It Is
A read-mostly view for client contacts (hiring managers). They see candidates submitted to their mandates, can leave feedback (remarks), and receive notifications when new candidates are submitted.

## Route Map
| Route | What it shows |
|---|---|
| `/[clientSlug]` | Client home — mandate overview |
| `/[clientSlug]/candidates` | Submitted candidates per mandate |
| `/[clientSlug]/mandates` | Active mandates for this client |

## Key Capabilities
- View candidates submitted for their mandates (`floats` with `isSentToClient = true`)
- View AI-generated reports (`candidate_reports.sharedWithClient = true`)
- Leave remarks per candidate (`client_remarks`)
- Read notifications (`client_notifications`)

## Access Control
`requireRole(['client'])` combined with `platformUsers.linkedClientId` ensures each client user only sees their own mandates and candidates. No cross-client data leakage.

## Contacts Model
`clients.contacts` is a JSON array (not a separate table). Each contact entry has `{ name, designation, number, email, linkedCandidateId? }`. `linkedCandidateId` allows a contact to be linked to a candidate record for cross-referencing.
