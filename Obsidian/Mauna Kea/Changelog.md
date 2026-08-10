# Changelog

Newest entry on top. Format: `YYYY-MM-DD — what changed — why`

---

2026-08-10 — strict manual/AI report isolation, candidate sync — Fixed critical bug where AI Workbench operations (generate, fetch, delete) blindly overwrote or leaked manual rubric assessments (`frameworkId: 'rubric-assessment'`). Built `/api/sync-candidates` to backfill missing badges and fix pipeline statuses across candidates.

2026-08-08 — initial knowledge base bootstrap — established vault structure from scratch, documented all 30+ DB tables, 3-portal architecture, auth/RBAC model, integrations, background jobs, AdvancedTable abstraction, and 5 decision records covering audit logging, floats vs candidates, RBAC enforcement, AdvancedTable rationale, and no-raw-scores-to-candidates policy
