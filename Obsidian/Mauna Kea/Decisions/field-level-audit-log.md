# Decision: Field-Level Audit Logging

**Status:** Active  
**Confirmed in:** `src/db/schema.ts` — `candidates.auditLog`, `mandates.auditLog`

## What Was Decided
Instead of a separate `audit_log` table, field-level change history is stored directly in a JSON column (`audit_log`) on the entity itself.

## Structure
```ts
auditLog: Record<string, { updatedBy: string; updatedAt: string }>
// key = field name that was changed
// value = who changed it and when
```

Example:
```json
{
  "company": { "updatedBy": "Priya S.", "updatedAt": "2026-07-15T10:30:00Z" },
  "designation": { "updatedBy": "Rahul M.", "updatedAt": "2026-08-01T14:00:00Z" }
}
```

## Why This (Not a Separate Table)
- Simpler to query — audit data comes with the record, no join needed
- Candidates and mandates are the only entities requiring this level of field tracking
- A full separate audit log table would require significantly more infrastructure for the current scale
- Tradeoff accepted: only stores the *last* change per field, not full history

## Limitations
- No historical trail — only the most recent update per field is stored
- Cannot replay full change history for compliance auditing
- If full history is ever needed, a `field_audit_log` table with (entity_type, entity_id, field, old_value, new_value, changed_by, changed_at) would need to be added

## Tables Using This Pattern
- `candidates.auditLog`
- `mandates.auditLog`
- `clients.metadata` (less formal, general-purpose extension bag)
