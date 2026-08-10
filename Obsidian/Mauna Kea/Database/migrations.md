# Database — Migration Changelog

Source: `drizzle/` directory. ORM: Drizzle Kit. Config: `drizzle.config.ts`.

## Migration Files

### 0000_married_miss_america.sql
**Initial schema.** Created tables: `candidate_files`, `float_references`, `floats`, `float_followups`, `float_activities`, `frameworks`, `framework_categories`, `framework_criteria`, `candidates`, `mandate_candidates`, `mandates`, `platform_users`, `candidate_reports`, `clients`, `client_notifications`, `client_remarks`, `candidate_notifications`, `consultant_notifications`.

Note: `candidate_files.cand_id` was `varchar(20)` in this migration (later widened).

### 0001_fix_indexes_and_rls.sql
**Index additions and RLS fixes.** Adds performance indexes; adjusts Row Level Security policies (Supabase).

### 0002_nifty_lifeguard.sql
**Schema evolution.** Specific columns added (details in file).

## Script-Based Migrations (outside Drizzle)
These were applied via one-off `npx tsx` scripts:

| Script | Purpose |
|---|---|
| `scripts/add_performance_indexes.ts` | Composite indexes for common filter patterns |
| `scripts/add_phase2_migration.ts` | Phase 2 tables (reference_checks, candidate_verifications, candidate_notifications, etc.) |
| `scripts/migrate_relational_data.ts` | Data backfill for relational fields |

## Post-BRD Manual Seeds
| What | When | Method |
|---|---|---|
| `rubric-assessment` framework row | Phase 2 | `npx tsx --env-file=.env.local seed-rubric.ts` |
