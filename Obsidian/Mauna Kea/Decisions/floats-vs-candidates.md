# Decision: Floats vs Candidates (Conceptual Separation)

**Status:** Active  
**Confirmed in:** `src/db/schema.ts` — `candidates` and `floats` are separate tables with a 1:many relationship

## What Was Decided
Candidate records and submission records (Floats) are **separate entities**. A candidate is a person. A float is a business event — "we submitted this person to this client for this role."

## Why Separate

### A candidate can exist without any float
- Candidates are added to the system independently of any active search
- A candidate in the "universe" stage has never been submitted anywhere
- The master `candidates` table is the permanent, reusable record of the person

### A candidate can have many floats
- The same person may be submitted to multiple clients and multiple mandates over time
- Each submission has its own lifecycle, status, and follow-up trail
- Merging this into `candidates` would require repeating submission fields N times or using JSON arrays — both are anti-patterns

### Data ownership is different
- Candidate data (name, email, experience) is sourced from the person
- Float data (dateShared, status, client feedback) is produced by the business process
- Mixing them would create a "god table" anti-pattern

## What "Float" Means at Mauna Kea
Domain vocabulary: when a consultant sends a candidate profile to a client, they are "floating" the candidate. The Float List is the day-to-day CRM view of all active floats.

## Consequence: Two Ways to View the Same Data
- The **Mandate Pipeline** (`/dashboard/mandates/[id]`) shows candidates per mandate
- The **Float List** (`/dashboard/float-list`) shows submissions per consultant as a CRM
- Both read from `floats` and `mandate_candidates` but present different views

## See Also
- [[Database/floats]]
- [[Database/candidates]]
- [[Features/float-list]]
