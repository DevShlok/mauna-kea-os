# Scripts (One-Off Maintenance Tooling)

**Directory:** `scripts/` (root level)

Scripts are run locally via `npx tsx --env-file=.env.local scripts/<filename>` and are NOT deployed.

## Scripts

### `add_performance_indexes.ts`
Adds composite database indexes for common filter patterns. Run when query performance degrades on large candidate lists. Safe to re-run (uses `CREATE INDEX IF NOT EXISTS`).

### `add_phase2_migration.ts`
Applied Phase 2 schema changes (reference_checks, candidate_verifications, candidate_notifications, candidateBadges, etc.). Has already been run. Do not re-run.

### `migrate_relational_data.ts`
Backfills relational data — e.g., populating `clients.id` references on existing `mandates` rows, backfilling `candidates.slug` for existing records. Run once after schema additions. Already applied.

## Convention for New Scripts
- One script per migration task
- Add a comment at the top: `// Run once. Already applied: [date]` if it has been run
- Use `npx tsx --env-file=.env.local` to load environment variables
- Prefer `ON CONFLICT DO NOTHING` / `upsert` patterns to make scripts idempotent where possible
- Never run scripts against production without reviewing them against a local DB first
