# Float List (Submission CRM)

**Route:** `/dashboard/float-list`
**Component:** `src/features/float-list/components/FlCandidateClient.tsx`
**Tables:** [[Database/floats]], [[Database/float_followups]], [[Database/other-tables#float_activities]]

## What It Is
The Float List is the primary CRM view for tracking all live candidate submissions. A "float" = one candidate submitted to one client for one role. Consultants use this daily to manage follow-ups and update pipeline status.

## Key Capabilities
- Filter by status, client, consultant, date range
- Inline status updates (drag or click)
- Add/view follow-up tasks per float
- Activity log (pinnable notes)
- View feedback received from client (feedbackPositives/Improvements/NextSteps)
- Nudge consultant (sends email via Resend; 7-day cooldown enforced via `nudgeSentAt`)
- Link to full candidate detail

## Status Pipeline
`Not Submitted → Submitted → Under Review → Interview → Offer → Placed | Rejected | On Hold`

## Nudge Cooldown
When a consultant clicks "Nudge" on a float, `nudgeSentAt` is set. The nudge button is disabled for 7 days after the last nudge. A 2-day reminder cooldown also applies.

## Relation to Mandate Pipeline
The Float List is a flattened cross-mandate view. The Mandate Pipeline shows the same data organised by mandate. Same underlying [[Database/floats]] table.

## See Also
- [[Decisions/floats-vs-candidates]]
- [[Features/mandate-pipeline]]
